"""
Ticket Queue / Tickets Page screen -- read-only endpoint that reshapes
existing Ticket + Employee rows into the flat shape the frontend's
tickets page expects. No new business logic: every field is either read
straight off an existing model column (joined, not N+1-queried) or, where
no corresponding backend field exists, explicitly returned as None with
a "# mock" comment -- same convention routers/onboardingDetails.py uses.
"""
from app.models.agent_monitor_model import AgentTicket
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.orchestrators.onboarding_orchestrator import AGENT_DISPLAY_NAMES


from app.database import get_db
from app.models import Employee, Ticket, ProvisioningRecord

router = APIRouter(prefix="/tickets-page", tags=["tickets-page"])

FUNCTIONAL_AGENT_KEYS = ["Identity Agent", "Email Agent", "Time & Billing Agent", "Document Management Agent"]

_AGENT_DISPLAY_TO_KEY = {display: key for key, display in AGENT_DISPLAY_NAMES.items()}

def _format_dt(value):
    """Same "%d-%m-%Y %H:%M:%S" formatting routers/onboardingDetails.py's
    _format_dt helper uses, kept local since that helper isn't exported."""
    return value.strftime("%d-%m-%Y %H:%M:%S") if value else None


def _ticket_out(ticket: Ticket, employee: Employee, provisioning_record: ProvisioningRecord) -> dict:
    return {
        "ticketID": ticket.ticket_reference,  # real -- Ticket.ticket_id
        "employeeID": employee.employee_id if employee else None,  # real -- Employee.employee_id
        "employeeName": employee.name if employee else None,  # real -- Employee.name
        "department": employee.department if employee else None,  # real -- Employee.department
        "request": ticket.title,  # real -- closest existing request description, Ticket.provisioning_item
        "system": provisioning_record.software_name if provisioning_record else "Mock",  # real -- Ticket.software_name
        "priority": "High",  # mock -- no priority column anywhere in the schema
        "status": ticket.status,  # real -- Ticket.status
        "created": _format_dt(ticket.created_at),  # real -- Ticket.created_at
    }

from sqlalchemy import and_
@router.get("")
def list_tickets_page(db: Session = Depends(get_db)):

    """Single joined query (Ticket -> Employee) instead of N+1 per-ticket
    employee lookups. Returns an empty tickets list if no tickets exist."""
    rows = (
        db.query(AgentTicket, Employee)
        .join(Employee, AgentTicket.employee_id == Employee.employee_id)
        .order_by(AgentTicket.created_at.desc())
        .all()
    )

    result = []

    for ticket, employee in rows:
        agent_key = _AGENT_DISPLAY_TO_KEY.get(ticket.agent_name)
        if agent_key is None and ticket.agent_name and ticket.agent_name.endswith(" Agent"):
            agent_key = ticket.agent_name[: -len(" Agent")]

        provisioning_record = (
            db.query(ProvisioningRecord)
            .filter(
                ProvisioningRecord.employee_id == employee.id,
                ProvisioningRecord.agent_key == agent_key,
            )
            .first()
        )

        if provisioning_record is None:
            continue
        
        result.append(_ticket_out(ticket, employee, provisioning_record))

    return {"tickets": result}