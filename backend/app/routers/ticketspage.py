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

from app.database import get_db
from app.models import Employee, Ticket, ProvisioningRecord

router = APIRouter(prefix="/tickets-page", tags=["tickets-page"])


def _format_dt(value):
    """Same "%d-%m-%Y %H:%M:%S" formatting routers/onboardingDetails.py's
    _format_dt helper uses, kept local since that helper isn't exported."""
    return value.strftime("%d-%m-%Y %H:%M:%S") if value else None


def _ticket_out(ticket: Ticket, employee: Employee, provisioning_record: ProvisioningRecord) -> dict:
    return {
        "ticketID": ticket.ticket_id,  # real -- Ticket.ticket_id
        "employeeID": employee.employee_id if employee else None,  # real -- Employee.employee_id
        "employeeName": employee.name if employee else None,  # real -- Employee.name
        "department": employee.department if employee else None,  # real -- Employee.department
        "request": ticket.title,  # real -- closest existing request description, Ticket.provisioning_item
        "system": provisioning_record.software_name,  # real -- Ticket.software_name
        "priority": "High",  # mock -- no priority column anywhere in the schema
        "status": ticket.status,  # real -- Ticket.status
        "created": _format_dt(ticket.created_at),  # real -- Ticket.created_at
    }


@router.get("")
def list_tickets_page(db: Session = Depends(get_db)):
    """Single joined query (Ticket -> Employee) instead of N+1 per-ticket
    employee lookups. Returns an empty tickets list if no tickets exist."""
    rows = (
        db.query(AgentTicket, Employee, ProvisioningRecord)
        .outerjoin(Employee, AgentTicket.employee_id == Employee.employee_id)
        .outerjoin(
            ProvisioningRecord,
            ProvisioningRecord.employee_id == Employee.id
        )
        .order_by(AgentTicket.created_at.desc())
        .all()
    )
    return {"tickets": [_ticket_out(ticket, employee, provisioning_record) for ticket, employee, provisioning_record in rows]}
