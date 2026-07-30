from fastapi import APIRouter, HTTPException
from app.database import get_db
from services.agent_ticketing_service import TicketRepository

router = APIRouter()
db = get_db()
repository = TicketRepository(db)


@router.get("/tickets")
def list_tickets():
    return repository.get_all_tickets()

@router.get("/tickets/{ticket_id}")
def get_ticket(ticket_id: int):
    ticket = repository.get_ticket_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="AgentTicket not found")
    return ticket

@router.put("/tickets/{ticket_id}/close")
def close_ticket(ticket_id: int):
    ticket = repository.get_ticket_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="AgentTicket not found")
    repository.close_ticket(ticket_id)
    return {"ticket_id": ticket_id, "status": "CLOSED"}

@router.post("/tickets/{ticket_id}/followup")
def add_followup(ticket_id: int, content: str):
    ticket = repository.get_ticket_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="AgentTicket not found")
    repository.add_followup(ticket_id, content)
    return {"ticket_id": ticket_id, "followup_added": True}

@router.get("/tickets/summary/counts")
def get_status_counts():
    return repository.get_status_counts()