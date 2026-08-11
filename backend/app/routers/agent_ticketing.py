from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.agent_ticketing_service import TicketRepository

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.schemas import TicketCreateRequest, TicketUpdateRequest

router = APIRouter(prefix="/agenttickets", tags=["Agent Tickets"])
repository = TicketRepository()


@router.get("/summary/counts", operation_id="agent_ticketing_get_counts")
def get_status_counts(db: Session = Depends(get_db)):
    return repository.get_status_counts(db)


@router.get("/", operation_id="agent_ticketing_list_tickets")
def list_tickets(db: Session = Depends(get_db)):
    return repository.get_all_tickets(db)


@router.get("/{ticket_id}", operation_id="agent_ticketing_get_ticket")
def get_ticket(ticket_id: int, db: Session = Depends(get_db)):
    ticket = repository.get_ticket_by_id(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.post("/", operation_id="agent_ticketing_create_ticket")
def create_ticket(request: TicketCreateRequest, db: Session = Depends(get_db)):
    ticket_id = repository.create_ticket(
        db, request.title, request.content, request.agent_name, request.employee_id
    )
    return {"ticket_id": ticket_id, "created": True}


@router.put("/{ticket_id}", operation_id="agent_ticketing_update_ticket")
def update_ticket(ticket_id: int, request: TicketUpdateRequest, db: Session = Depends(get_db)):
    updated = repository.update_ticket(
        db, ticket_id, title=request.title, content=request.content, status=request.status
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"ticket_id": ticket_id, "updated": True}


@router.put("/{ticket_id}/close", operation_id="agent_ticketing_close_ticket")
def close_ticket(ticket_id: int, db: Session = Depends(get_db)):
    ticket = repository.get_ticket_by_id(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    repository.close_ticket(db, ticket_id)
    return {"ticket_id": ticket_id, "status": "Closed"}


@router.delete("/{ticket_id}", operation_id="agent_ticketing_delete_ticket")
def delete_ticket(ticket_id: int, db: Session = Depends(get_db)):
    deleted = repository.delete_ticket(db, ticket_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"ticket_id": ticket_id, "deleted": True}


@router.post("/{ticket_id}/followup", operation_id="agent_ticketing_add_followup")
def add_followup(ticket_id: int, content: str, db: Session = Depends(get_db)):
    ticket = repository.get_ticket_by_id(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    repository.add_followup(db, ticket_id, content)
    repository.update_content(db,ticket_id,content)
    return {"ticket_id": ticket_id, "followup_added": True}