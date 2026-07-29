from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.integrations.hrms_connector import pull_new_hires
from app.orchestrators.onboarding_orchestrator import run_onboarding

router = APIRouter(prefix="/hrms", tags=["hrms-sync"])


@router.post("/sync/new-hires")
def sync_new_hires(db: Session = Depends(get_db)):
    """Pulls new hires from the mock HRMS, creates employee records, and
    kicks off onboarding for each one -- this is the 'Sync from HRMS'
    button on the Employee Directory screen, and PDD step 1->2
    (HR creates/updates an employee -> AI Orchestrator receives the event)."""
    new_employees = pull_new_hires(db)
    results = []
    for employee in new_employees:
        outcome = run_onboarding(db, employee.id)
        results.append({"employee_id": employee.id, "name": employee.name, "outcome": outcome})
    return {"synced_count": len(new_employees), "results": results}

# NOTE: no /sync/exits endpoint -- offboarding is out of scope for the
# PDD v3 POC (see MIGRATION_NOTES.md). Re-add here (and restore
# pull_exits() in integrations/hrms_connector.py) if offboarding comes
# back into scope later.
