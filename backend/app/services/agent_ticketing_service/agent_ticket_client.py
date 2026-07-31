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

    def report_started(self) -> int:
        db_gen = get_db()
        db = next(db_gen)
        try:
            return self._service.handle_agent_started(db, self._agent_name, self._employee_id)
        finally:
            db_gen.close()

    def report_problem(self, error_details: str):
        db_gen = get_db()
        db = next(db_gen)
        try:
            return self._service.handle_agent_problem(db, self._agent_name, self._employee_id, error_details)
        finally:
            db_gen.close()

    def report_completed(self):
        db_gen = get_db()
        db = next(db_gen)
        try:
            return self._service.handle_agent_completed(db, self._agent_name, self._employee_id)
        finally:
            db_gen.close()