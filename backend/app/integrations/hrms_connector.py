"""
Pulls new-hire records from the mock HRMS service and maps them onto the
internal Employee schema. This is the module that gets swapped when a
real HRMS (Workday/ADP/BambooHR) is connected post-POC -- only the base
URL and field mapping change, nothing downstream. Kept unchanged in
shape from the previous version (this pattern doesn't need to change
for v3), just trimmed of fields tied to genuinely removed features
(ssn_number and exits/offboarding aren't in scope for this POC).

document-fetching functions below were reintroduced after an earlier
pass removed them entirely -- that removal conflated "document
VALIDATION" (OCR/matching, out of scope for PDD v3) with "having
document files available at all" (needed once
app/integrations/openkm_connector.py became a real document
repository that's worth seeding with the employee's onboarding
documents). See MIGRATION_NOTES.md.
"""
import os
import requests
from sqlalchemy.orm import Session
from app.models import Employee
from app.schemas.employee import EmployeeCreate

HRMS_URL = os.getenv("MOCK_HRMS_URL", "http://localhost:9000")

# Filename substrings excluded by default when seeding a document
# repository -- SSN scans and bank details are sensitive PII that
# probably shouldn't land in a general document workspace alongside a
# resume and offer letter without a real decision on where they *should*
# go instead (a separate, more restricted HR-only location, most likely).
# TODO: this is a judgment call flagged for whoever owns document
# retention/compliance policy, not something this connector should
# silently decide alone -- confirm before relying on this default.
SENSITIVE_DOCUMENT_MARKERS = ["ssn", "bankdetails"]


def _map_new_hire(record: dict) -> EmployeeCreate:
    """Maps mock-HRMS field names onto our Employee schema.
    Swap this mapping when pointing at a real HRMS export.

    role: HRMS sends this directly (Tax | Audit | Law | IT Support) --
    AI role classification (agents/role_classifier.py) only runs as a
    fallback if this is missing or invalid, see the orchestrator's role
    resolution step."""
    return EmployeeCreate(
        name=record["full_name"],
        employee_id=record["hrms_employee_id"],
        email=record["work_email"],
        department=record["department"],
        role=record.get("role"),
        office=record.get("location"),
        manager=record.get("manager_name"),
        years_of_experience=record.get("years_of_experience"),
        phonenumber=record.get("phone_number"),
        employee_location=record.get("employee_location"),
        job_Level=record.get("job_Level"),
        joining_date=record.get("start_date"),
        sync_source="hrms",
    )


def list_employee_documents(hrms_employee_id: str, exclude_sensitive: bool = True) -> list[str]:
    """Returns the filenames of this employee's onboarding documents
    (offer letter, resume, etc.) available in the mock HRMS. Used to
    seed the employee's new OpenKM workspace -- see
    orchestrators/onboarding_orchestrator.py's document-seeding step.

    exclude_sensitive=True (the default) filters out filenames matching
    SENSITIVE_DOCUMENT_MARKERS (SSN scans, bank details) -- see that
    constant's TODO. Set False only if that judgment call has been
    deliberately overridden."""
    resp = requests.get(f"{HRMS_URL}/hrms/employees/{hrms_employee_id}/documents", timeout=5)
    resp.raise_for_status()
    filenames = resp.json().get("filenames", [])
    if exclude_sensitive:
        filenames = [f for f in filenames if not any(marker in f.lower() for marker in SENSITIVE_DOCUMENT_MARKERS)]
    return filenames


def get_employee_document(hrms_employee_id: str, filename: str) -> bytes:
    """Fetches one document's raw bytes for upload into OpenKM."""
    resp = requests.get(f"{HRMS_URL}/hrms/employees/{hrms_employee_id}/documents/{filename}", timeout=10)
    resp.raise_for_status()
    return resp.content


def pull_new_hires(db: Session) -> list[Employee]:
    resp = requests.get(f"{HRMS_URL}/hrms/employees/new", timeout=5)
    resp.raise_for_status()
    records = resp.json()

    created = []
    for record in records:
        mapped = _map_new_hire(record)
        exists = db.query(Employee).filter(Employee.employee_id == mapped.employee_id).first()
        if exists:
            continue
        employee = Employee(**mapped.model_dump())
        db.add(employee)
        db.commit()
        db.refresh(employee)
        created.append(employee)
        # ack back to mock HRMS so re-running the demo doesn't reprocess
        try:
            requests.post(f"{HRMS_URL}/hrms/employees/{record['hrms_employee_id']}/ack", timeout=5)
        except requests.RequestException:
            pass
    return created
