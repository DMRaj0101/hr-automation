from app.models.agent_monitor_model import AgentTicket, TicketFollowup
from sqlalchemy.orm import Session

class TicketRepository:
    """All DB access for local tickets/followups. No business logic here."""

    def __init__(self, db: Session):
        self._db = db

    def create_ticket(self, title: str, content: str, agent_name: str, employee_id: str) -> int:
        session = self._db
        try:
            ticket = AgentTicket(
                title=title, content=content, status="NEW",
                agent_name=agent_name, employee_id=employee_id,
            )
            session.add(ticket)
            session.commit()
            session.refresh(ticket)
            return ticket.ticket_id
        finally:
            session.close()

    def add_followup(self, ticket_id: int, content: str):
        session = self._db.get_session()
        try:
            followup = TicketFollowup(ticket_id=ticket_id, content=content)
            session.add(followup)
            session.commit()
        finally:
            session.close()

    def update_status(self, ticket_id: int, status: str):
        session = self._db
        try:
            ticket = session.query(AgentTicket).filter_by(ticket_id=ticket_id).first()
            if ticket:
                ticket.status = status
                session.commit()
        finally:
            session.close()

    def close_ticket(self, ticket_id: int):
        self.update_status(ticket_id, "CLOSED")

    def get_all_tickets(self) -> list[dict]:
        session = self._db
        try:
            tickets = session.query(AgentTicket).order_by(AgentTicket.created_at.desc()).all()
            return [self._to_dict(t, include_latest_followup=True) for t in tickets]
        finally:
            session.close()

    def get_ticket_by_id(self, ticket_id: int) -> dict | None:
        session = self._db
        try:
            ticket = session.query(AgentTicket).filter_by(ticket_id=ticket_id).first()
            if not ticket:
                return None
            result = self._to_dict(ticket)
            result["followups"] = [
                {"followup_id": f.followup_id, "content": f.content, "created_at": f.created_at}
                for f in ticket.followups
            ]
            return result
        finally:
            session.close()

    def find_ticket_id_for_agent_run(self, agent_name: str, employee_id: str) -> int | None:
        session = self._db
        try:
            ticket = (
                session.query(AgentTicket)
                .filter(AgentTicket.agent_name == agent_name, AgentTicket.employee_id == employee_id)
                .order_by(AgentTicket.created_at.desc())
                .first()
            )
            return ticket.ticket_id if ticket else None
        finally:
            session.close()

    def get_status_counts(self) -> dict:
        session = self._db
        try:
            from sqlalchemy import func
            results = (
                session.query(AgentTicket.status, func.count(AgentTicket.ticket_id))
                .group_by(AgentTicket.status)
                .all()
            )
            counts = {"PROCESSING": 0, "PROBLEM": 0, "CLOSED": 0, "NEW": 0}
            for status, count in results:
                counts[status] = count
            return counts
        finally:
            session.close()

    @staticmethod
    def _to_dict(ticket: AgentTicket,include_latest_followup: bool = False) -> dict:
        result= {
            "ticket_id": ticket.ticket_id,
            "title": ticket.title,
            "content": ticket.content,
            "status": ticket.status,
            "agent_name": ticket.agent_name,
            "employee_id": ticket.employee_id,
            "created_at": ticket.created_at,
            "updated_at": ticket.updated_at,
        }
        if include_latest_followup:
            problem_details = None
            if ticket.status == "PROBLEM" and ticket.followups:
                latest = max(ticket.followups, key=lambda f: f.created_at)
                problem_details = latest.content
            result["problem_details"] = problem_details

        return result