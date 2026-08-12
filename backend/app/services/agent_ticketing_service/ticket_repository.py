from app import database
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models import AgentTicket, TicketFollowup


class TicketRepository:
    """All DB access for tickets/followups. Session is always passed in externally."""

    def create_ticket(self, db: Session, title: str, content: str, agent_name: str, employee_id: str) -> int:
        ticket = AgentTicket(title=title, content=content, status="New", agent_name=agent_name, employee_id=employee_id)
        db.add(ticket)
        db.commit()
        db.refresh(ticket)
        return ticket.ticket_id

    def add_followup(self, db: Session, ticket_id: int, content: str):
        followup = TicketFollowup(ticket_id=ticket_id, content=content)
        db.add(followup)
        db.commit()

    def update_status(self, db: Session, ticket_id: int, status: str):
        ticket = db.query(AgentTicket).filter_by(ticket_id=ticket_id).first()
        if ticket:
            ticket.status = status
            db.commit()

    def close_ticket(self, db: Session, ticket_id: int):
        self.update_status(db, ticket_id, "Closed")

    def get_all_tickets(self, db: Session) -> list[dict]:
        tickets = db.query(AgentTicket).order_by(AgentTicket.created_at.desc()).all()
        return [self._to_dict(t, include_latest_followup=True) for t in tickets]

    def get_ticket_by_id(self, db: Session, ticket_id: int) -> dict | None:
        ticket = db.query(AgentTicket).filter_by(ticket_id=ticket_id).first()
        if not ticket:
            return None
        result = self._to_dict(ticket)
        result["followups"] = [
            {"followup_id": f.followup_id, "content": f.content, "created_at": f.created_at}
            for f in ticket.followups
        ]
        return result

    def find_ticket_id_for_agent_run(self, db: Session, agent_name: str, employee_id: str) -> int | None:
        ticket = (
            db.query(AgentTicket)
            .filter(AgentTicket.agent_name == agent_name, AgentTicket.employee_id == employee_id)
            .order_by(AgentTicket.created_at.desc())
            .first()
        )
        return ticket.ticket_id if ticket else None

    def get_status_counts(self, db: Session) -> dict:
        results = db.query(AgentTicket.status, func.count(AgentTicket.ticket_id)).group_by(AgentTicket.status).all()
        counts = {"Processing": 0, "Failed": 0, "Closed": 0, "New": 0}
        for status, count in results:
            counts[status] = count
        return counts

    def update_ticket(self, db: Session, ticket_id: int, title: str = None, content: str = None, status: str = None) -> bool:
        ticket = db.query(AgentTicket).filter_by(ticket_id=ticket_id).first()
        if not ticket:
            return False
        if title is not None:
            ticket.title = title
        if content is not None:
            ticket.content = content
        if status is not None:
            ticket.status = status
        db.commit()
        return True

    def delete_ticket(self, db: Session, ticket_id: int) -> bool:
        ticket = db.query(AgentTicket).filter_by(ticket_id=ticket_id).first()
        if not ticket:
            return False
        db.query(TicketFollowup).filter_by(ticket_id=ticket_id).delete()
        db.delete(ticket)
        db.commit()
        return True

    def update_content(self, db: Session, ticket_id: int, content: str):
        ticket = db.query(AgentTicket).filter_by(ticket_id=ticket_id).first()
        if ticket:
            ticket.content = content
            db.commit()

    def set_start_time(self, db: Session, ticket_id: int, start_time: datetime = None):
        ticket = db.query(AgentTicket).filter_by(ticket_id=ticket_id).first()
        if ticket:
            ticket.start_time = start_time or datetime.utcnow()
            db.commit()

    def set_end_time(self, db: Session, ticket_id: int, end_time: datetime = None):
        ticket = db.query(AgentTicket).filter_by(ticket_id=ticket_id).first()
        if ticket:
            ticket.end_time = end_time or datetime.utcnow()
            db.commit()

    def generate_ticket_reference(self, db: Session, ticket_id: int, override: str = None) -> str:
        reference = override or (f"TKT-{ticket_id:04d}" if ticket_id <= 9999 else f"TKT-{ticket_id}")
        ticket = db.query(AgentTicket).filter_by(ticket_id=ticket_id).first()
        if ticket:
            ticket.ticket_reference = reference
            db.commit()
        return reference

    @staticmethod
    def _to_dict(ticket: AgentTicket, include_latest_followup: bool = False) -> dict:
        result = {
            "ticket_id": ticket.ticket_id,
            "ticket_reference": ticket.ticket_reference,
            "title": ticket.title,
            "content": ticket.content,
            "status": ticket.status,
            "agent_name": ticket.agent_name,
            "employee_id": ticket.employee_id,
            "start_time": ticket.start_time,
            "end_time": ticket.end_time,
            "created_at": ticket.created_at,
            "updated_at": ticket.updated_at,
        }
        if include_latest_followup:
            problem_details = None
            if ticket.status.upper() == "FAILED" and ticket.followups:
                latest = max(ticket.followups, key=lambda f: f.created_at)
                problem_details = latest.content
            result["problem_details"] = problem_details
        return result