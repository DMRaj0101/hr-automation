"""
Trigger + read endpoints for the onboarding flow. Trimmed heavily from
the previous version -- the per-task email/document endpoints are gone
along with the models they served (see MIGRATION_NOTES.md). What's left:
starting the orchestrator, and reading back its step-by-step execution
log (backs both the reused Onboarding Tracker screen and the new
Execution Trace screen -- PDD Section 9).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Employee, OnboardingTracker, ProvisioningRecord, Ticket
from app.orchestrators.onboarding_orchestrator import run_onboarding

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.post("/{employee_id}/start")
def start_onboarding(employee_id: str, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return run_onboarding(db, employee_id)


@router.get("/{employee_id}/status")
def onboarding_status(employee_id: str, db: Session = Depends(get_db)):
    """Frontend polls this to drive the Onboarding Tracker / Execution
    Trace timeline UI. Read-only."""
    rows = (
        db.query(OnboardingTracker)
        .filter(OnboardingTracker.employee_id == employee_id)
        .order_by(OnboardingTracker.timestamp.asc())
        .all()
    )
    return [
        {"step": r.step, "status": r.status, "detail": r.detail, "timestamp": r.timestamp}
        for r in rows
    ]


@router.get("/{employee_id}/provisioning")
def provisioning_status(employee_id: str, db: Session = Depends(get_db)):
    """Real-system provisioning status per Functional item -- what the
    Monitoring Agent Console and the Knowledge Agent's "which
    applications do I have access to" answers both read from."""
    records = (
        db.query(ProvisioningRecord)
        .filter(ProvisioningRecord.employee_id == employee_id)
        .all()
    )
    return [
        {
            "provisioning_item": r.provisioning_item, "software_name": r.software_name,
            "status": r.status, "retry_count": r.retry_count, "error_detail": r.error_detail,
            "completed_at": r.completed_at,
        }
        for r in records
    ]


@router.get("/{employee_id}/tickets")
def employee_tickets(employee_id: str, db: Session = Depends(get_db)):
    """Mock items for this employee -- shown alongside provisioning
    status on the Employee Profile screen."""
    tickets = db.query(Ticket).filter(Ticket.employee_id == employee_id).all()
    return [
        {"ticket_id": t.ticket_id, "provisioning_item": t.provisioning_item,
         "assigned_team": t.assigned_team, "status": t.status}
        for t in tickets
    ]
