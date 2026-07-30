from app.database import get_db
from services.agent_ticketing_service import TicketRepository
from services.agent_ticketing_service import TicketService


class AgentTicketClient:
    """Called directly from inside each of the 6 agents.
    Wraps TicketService so agents call one simple interface — no DB/session details leak out."""

    def __init__(self, agent_name: str, employee_id: str):
        db = get_db()
        repository = TicketRepository(db)
        self._service = TicketService(repository)
        self._agent_name = agent_name
        self._employee_id = employee_id

    def report_started(self) -> int:
        return self._service.handle_agent_started(self._agent_name, self._employee_id)

    def report_problem(self, error_details: str):
        return self._service.handle_agent_problem(self._agent_name, self._employee_id, error_details)

    def report_completed(self):
        return self._service.handle_agent_completed(self._agent_name, self._employee_id)