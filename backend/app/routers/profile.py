"""
Employee Profile screen (PDD Section 9 -- "Existing platform, reused").
Rewritten for the new data model: personal/employment info, the
execution trace timeline, provisioning status per Functional item, and
open/closed tickets for Mock items -- replacing the previous version's
task-track/compliance/access-recommendation view.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Employee, OnboardingTracker, ProvisioningRecord, Ticket, AuditLog, WelcomeEmail

router = APIRouter(prefix="/employees", tags=["profile"])


@router.get("/{employee_id}/profile")
def get_profile(employee_id: str, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    timeline = (
        db.query(OnboardingTracker)
        .filter(OnboardingTracker.employee_id == employee_id)
        .order_by(OnboardingTracker.timestamp.asc())
        .all()
    )
    provisioning = (
        db.query(ProvisioningRecord)
        .filter(ProvisioningRecord.employee_id == employee_id)
        .all()
    )
    tickets = db.query(Ticket).filter(Ticket.employee_id == employee_id).all()
    welcome_email = db.query(WelcomeEmail).filter(WelcomeEmail.employee_id == employee_id).first()
    recent_activity = (
        db.query(AuditLog)
        .filter(AuditLog.employee_id == employee_id)
        .order_by(AuditLog.timestamp.desc())
        .limit(10)
        .all()
    )

    return {
        "personal_information": {
            "name": employee.name, "employee_id": employee.employee_id,
            "email": employee.email, "office": employee.office,
        },
        "employment_details": {
            "department": employee.department, "title": employee.title, "role": employee.role,
            "manager": employee.manager, "joining_date": employee.joining_date,
            "status": employee.status, "sync_source": employee.sync_source,
        },
        "timeline": [
            {"step": t.step, "status": t.status, "detail": t.detail, "timestamp": t.timestamp}
            for t in timeline
        ],
        "provisioning": [
            {"item": p.provisioning_item, "software_name": p.software_name,
             "status": p.status, "retry_count": p.retry_count, "error_detail": p.error_detail}
            for p in provisioning
        ],
        "tickets": [
            {"ticket_id": t.ticket_id, "item": t.provisioning_item,
             "assigned_team": t.assigned_team, "status": t.status}
            for t in tickets
        ],
        # NOTE: welcome_email.body currently contains any real credentials
        # (temp passwords) in plaintext -- see
        # orchestrators/onboarding_orchestrator.py's
        # _draft_and_queue_welcome_email() docstring for the security
        # tradeoff note. Frontend should treat this as sensitive display
        # data (e.g. don't log it, consider masking by default with a
        # reveal action) until that's revisited.
        "welcome_email": (
            {"subject": welcome_email.subject, "body": welcome_email.body, "status": welcome_email.status}
            if welcome_email else None
        ),
        "recent_activity": [
            {"timestamp": a.timestamp, "agent": a.agent, "action": a.action, "detail": a.detail}
            for a in recent_activity
        ],
    }
