"""
Mock HRMS -- simulates a real HRMS's employee-feed API surface.
Backed by a JSON fixture file, not a real database, by design: this
service exists purely to prove out the connector/orchestrator pattern
without needing real Workday/ADP/BambooHR credentials.

Trimmed for PDD v3 (onboarding-only POC): the exits/offboarding feed is
removed along with the offboarding backend features that consumed it
(see MIGRATION_NOTES.md). Only the new-hire feed and document-serving
endpoints remain.

The document-listing/serving endpoints below were reintroduced after
being removed in an earlier pass -- that removal conflated two
different things: "document VALIDATION" (OCR, matching an SSN scan to
a name, the resubmit-request email loop -- genuinely out of scope for
PDD v3) and "having document files available to seed a new employee's
document-management workspace with" (a different, simpler feature that
turned out to be worth keeping once app/integrations/openkm_connector.py
became a real, working document repository). See MIGRATION_NOTES.md.

When a real HRMS is connected post-POC, this whole service is deleted
and hrms_connector.py in the backend points at the real API instead --
the mapping logic and field names are the only things that change.
"""
import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse

app = FastAPI(title="Mock HRMS")

BASE_DIR = os.path.dirname(__file__)
FIXTURES_DIR = os.path.join(BASE_DIR, "fixtures")
NEW_HIRES_FILE = os.path.join(FIXTURES_DIR, "new_hires.json")
DOCS_DIR = os.path.join(BASE_DIR, "mock_employee_docs")


def _load(path):
    with open(path) as f:
        return json.load(f)


def _save(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def _find_employee(hrms_employee_id: str) -> dict:
    records = _load(NEW_HIRES_FILE)
    for r in records:
        if r["hrms_employee_id"] == hrms_employee_id:
            return r
    raise HTTPException(status_code=404, detail="Employee not found in mock HRMS")


@app.get("/hrms/employees/new")
def get_new_hires():
    records = _load(NEW_HIRES_FILE)
    return [r for r in records if not r.get("synced")]


@app.post("/hrms/employees/{hrms_employee_id}/ack")
def ack_employee(hrms_employee_id: str):
    records = _load(NEW_HIRES_FILE)
    found = False
    for r in records:
        if r["hrms_employee_id"] == hrms_employee_id:
            r["synced"] = True
            found = True
    if found:
        _save(NEW_HIRES_FILE, records)
        return {"acked": hrms_employee_id}
    raise HTTPException(status_code=404, detail="Employee not found in mock HRMS")


@app.get("/hrms/employees/{hrms_employee_id}/documents")
def list_documents(hrms_employee_id: str):
    """Returns just the filenames (not the fixture's raw relative
    paths) -- callers use these filenames with the endpoint below to
    fetch actual bytes. Consumed by
    backend/app/integrations/hrms_connector.py's list_employee_documents()."""
    employee = _find_employee(hrms_employee_id)
    filenames = [os.path.basename(p) for p in employee.get("documents_files", [])]
    return {"hrms_employee_id": hrms_employee_id, "filenames": filenames}


@app.get("/hrms/employees/{hrms_employee_id}/documents/{filename}")
def get_document(hrms_employee_id: str, filename: str):
    """Serves the raw file. Path is deliberately reconstructed from
    hrms_employee_id + filename (not taken verbatim from the fixture's
    stored relative path) to avoid a path-traversal risk from a
    filename containing '../' -- see the basename-only check below."""
    if os.path.basename(filename) != filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    file_path = os.path.join(DOCS_DIR, hrms_employee_id, filename)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Document not found")
    return FileResponse(file_path, media_type="application/pdf", filename=filename)


@app.post("/hrms/_reset")
def reset_fixtures():
    """Dev convenience: unmark everyone as synced so the demo can be rerun."""
    records = _load(NEW_HIRES_FILE)
    for r in records:
        r["synced"] = False
    _save(NEW_HIRES_FILE, records)
    return {"reset": True}


@app.get("/")
def health():
    return {"status": "mock HRMS running"}
