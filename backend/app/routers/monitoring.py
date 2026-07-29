"""
Backs the Monitoring Agent Console screen (PDD Section 9 -- "New (POC)").
TODO (owner: whoever picks up the Monitoring Agent, after the connectors
exist for poll_once() in agents/monitoring_agent.py to do real work):
this currently just exposes what's already in the DB (retry counts,
last poll time, failures) -- it doesn't yet expose live system-health
checks (PDD Section 7's "Is Keycloak having issues?" Knowledge Agent
question depends on this eventually being richer than a DB read).
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ProvisioningRecord, Ticket

router = APIRouter(prefix="/monitoring", tags=["monitoring"])


@router.get("/console")
def monitoring_console(db: Session = Depends(get_db)):
    failing = db.query(ProvisioningRecord).filter(ProvisioningRecord.status == "failed").all()
    in_progress = db.query(ProvisioningRecord).filter(ProvisioningRecord.status == "in_progress").all()
    pending_tickets = db.query(Ticket).filter(Ticket.status == "Pending").all()

    return {
        "failing_provisioning_records": [
            {"employee_id": r.employee_id, "item": r.provisioning_item,
             "retry_count": r.retry_count, "error_detail": r.error_detail,
             "last_attempted_at": r.last_attempted_at}
            for r in failing
        ],
        "in_progress_provisioning_records": [
            {"employee_id": r.employee_id, "item": r.provisioning_item,
             "last_attempted_at": r.last_attempted_at}
            for r in in_progress
        ],
        "pending_tickets": [
            {"ticket_id": t.ticket_id, "assigned_team": t.assigned_team,
             "status_changed_at": t.status_changed_at}
            for t in pending_tickets
        ],
        # TODO: "system_health" per real system (Keycloak/MailU/Kimai/Snipe-IT)
        # -- needs each connector's get_*_status to support a lightweight
        # "is the system reachable at all" ping, separate from checking
        # one specific record. Not yet modeled.
    }
