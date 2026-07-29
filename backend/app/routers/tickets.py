"""
Backs the Ticket Queue screen (PDD Section 9 -- "New, native ticketing,
design complete, not yet built"). This is the one screen with no
existing frontend equivalent -- see frontend/app/ticket-queue/page.tsx
for the matching stub.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Ticket, Employee
from app.schemas.ticket import TicketStatusUpdate
from app.agents import ticket_agent

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.get("")
def list_tickets(team: str = None, status: str = None, db: Session = Depends(get_db)):
    """Optional ?team=IT&status=Open filtering for the Ticket Queue's
    team-scoped view -- TODO: wire real per-user team scoping once auth
    identifies which team a logged-in user belongs to (see routers/auth.py's
    DEMO_USERS role field, which already maps to HR/Manager/IT/Security)."""
    query = db.query(Ticket)
    if team:
        query = query.filter(Ticket.assigned_team == team)
    if status:
        query = query.filter(Ticket.status == status)
    tickets = query.order_by(Ticket.created_at.desc()).all()
    return [
        {
            "id": t.id, "ticket_id": t.ticket_id, "employee_id": t.employee_id,
            "role": t.role, "provisioning_item": t.provisioning_item,
            "software_name": t.software_name, "assigned_team": t.assigned_team,
            "status": t.status, "notes": t.notes, "created_at": t.created_at,
            "status_changed_at": t.status_changed_at, "closed_at": t.closed_at,
        }
        for t in tickets
    ]


@router.get("/{ticket_id}")
def get_ticket(ticket_id: str, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    employee = db.query(Employee).filter(Employee.id == ticket.employee_id).first()
    return {
        "ticket_id": ticket.ticket_id, "status": ticket.status,
        "provisioning_item": ticket.provisioning_item, "software_name": ticket.software_name,
        "assigned_team": ticket.assigned_team, "notes": ticket.notes,
        "status_history": ticket.status_history,
        "employee_name": employee.name if employee else None,
    }


@router.post("/{ticket_id}/status")
def update_ticket_status(ticket_id: str, payload: TicketStatusUpdate, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    # TODO: validate payload.status is one of Open/In Progress/Pending/Closed
    # -- and decide who's allowed to set closed_by (currently accepts
    # anything the frontend sends; likely wants the logged-in user's
    # identity from the auth token instead once auth is more than demo-only).
    updated = ticket_agent.update_status(db, ticket, payload.status, note=payload.note, closed_by=None)
    return {"ticket_id": updated.ticket_id, "status": updated.status}
