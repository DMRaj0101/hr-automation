from app.database import get_db
from app.services.agent_ticketing_service import TicketRepository
from app.services.agent_ticketing_service import TicketService


class AgentTicketClient:
    """Called directly from inside each of the 6 agents. Uses the same get_db() generator as the API."""

    def __init__(self, agent_name: str, employee_id: str):
        self._repository = TicketRepository()
        self._service = TicketService(self._repository)
        self._agent_name = agent_name
        self._employee_id = employee_id

    def report_started(self, ticket_reference: str = None) -> int:
        db_gen = get_db()
        db = next(db_gen)
        try:
            return self._service.handle_agent_started(db, self._agent_name, self._employee_id, ticket_reference=ticket_reference)
        finally:
            db_gen.close()

    def report_problem(self, error_details: str):
        db_gen = get_db()
        db = next(db_gen)
        try:
            return self._service.handle_agent_problem(db, self._agent_name, self._employee_id, error_details)
        finally:
            db_gen.close()

    def report_completed(self, detail: str = None):
        """`detail`: the connector's provisioning result sentence, stored as
        the ticket content and surfaced as the Provisional Status `note`."""
        db_gen = get_db()
        db = next(db_gen)
        try:
            return self._service.handle_agent_completed(db, self._agent_name, self._employee_id, detail=detail)
        finally:
            db_gen.close()