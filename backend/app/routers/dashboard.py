"""
Orchestration Dashboard summary endpoint (PDD Section 9 -- "New (POC)").
Rewritten from scratch for the new data model: employee status counts,
ticket counts by status/team, functional-provisioning success/failure
counts, and recent activity. The previous version's compliance/risk/
license widgets are gone along with the models they read from.
"""
import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Employee, Ticket, ProvisioningRecord, AuditLog

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_employees = db.query(Employee).count()
    active_onboarding = db.query(Employee).filter(Employee.status == "provisioning").count()
    completed_onboarding = db.query(Employee).filter(Employee.status == "active").count()

    ticket_rows = db.query(Ticket.status, func.count(Ticket.id)).group_by(Ticket.status).all()
    tickets_by_status = {status: count for status, count in ticket_rows}

    team_rows = db.query(Ticket.assigned_team, func.count(Ticket.id)).group_by(Ticket.assigned_team).all()
    tickets_by_team = {team: count for team, count in team_rows}

    provisioning_rows = db.query(ProvisioningRecord.status, func.count(ProvisioningRecord.id)).group_by(
        ProvisioningRecord.status
    ).all()
    provisioning_by_status = {status: count for status, count in provisioning_rows}

    role_rows = (
        db.query(Employee.role, func.count(Employee.id))
        .filter(Employee.role.isnot(None))
        .group_by(Employee.role)
        .all()
    )

    recent_activity = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(10).all()

    return {
        "total_employees": total_employees,
        "active_onboarding": active_onboarding,
        "completed_onboarding": completed_onboarding,
        "tickets_by_status": tickets_by_status,
        "tickets_by_team": tickets_by_team,
        "provisioning_by_status": provisioning_by_status,
        "role_distribution": [{"name": r, "count": c} for r, c in role_rows],
        "recent_activity": [
            {"timestamp": a.timestamp, "agent": a.agent, "action": a.action,
             "detail": a.detail, "employee_id": a.employee_id}
            for a in recent_activity
        ],
        # TODO: SLA-breach count once agents/monitoring_agent.py's
        # _check_sla_breaches() is implemented -- surface it here as
        # e.g. "tickets_over_sla": <count> for a dashboard alert widget.
    }
