"""
Pulls new-hire records from the mock HRMS service and maps them onto the
internal Employee schema. This is the module that gets swapped when a
real HRMS (Workday/ADP/BambooHR) is connected post-POC -- only the base
URL and field mapping change, nothing downstream. Kept unchanged in
shape from the previous version (this pattern doesn't need to change
for v3), just trimmed of fields tied to removed features
(ssn_number/documents_files were only used by the document-validation
flow, which isn't part of the PDD v3 scope; exits/offboarding likewise
isn't in scope for this POC).
"""
import os
import requests
from sqlalchemy.orm import Session
from app.models import Employee
from app.schemas.employee import EmployeeCreate

HRMS_URL = os.getenv("MOCK_HRMS_URL", "http://localhost:9000")


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
        title=record.get("job_title"),
        role=record.get("role"),
        office=record.get("location"),
        manager=record.get("manager_name"),
        joining_date=record.get("start_date"),
        sync_source="hrms",
    )


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
