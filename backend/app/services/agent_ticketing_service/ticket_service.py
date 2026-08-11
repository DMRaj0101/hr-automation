from sqlalchemy.orm import Session
from app.services.agent_ticketing_service import TicketRepository


class TicketService:
    """Business logic: translates agent status events into ticket actions. Session passed through from caller."""

    def __init__(self, repository: TicketRepository):
        self._repository = repository

    def handle_agent_started(self, db: Session, agent_name: str, employee_id: str) -> int:
        title = f"Agent Onboarding Run - {agent_name} - Employee {employee_id}"
        content = f"Agent '{agent_name}' started onboarding processing for employee {employee_id}."
        ticket_id = self._repository.create_ticket(db, title, content, agent_name, employee_id)
        self._repository.generate_ticket_reference(db, ticket_id)
        self._repository.update_status(db, ticket_id, "Processing")
        self._repository.set_start_time(db, ticket_id)
        self._repository.add_followup(db, ticket_id, content)
        return ticket_id

    def handle_agent_problem(self, db: Session, agent_name: str, employee_id: str, error_details: str):
        ticket_id = self._repository.find_ticket_id_for_agent_run(db, agent_name, employee_id)

        if not ticket_id:
            title = f"Agent Onboarding Run - {agent_name} - Employee {employee_id}"
            content = f"Agent '{agent_name}' reported a problem for employee {employee_id}."
            ticket_id = self._repository.create_ticket(db, title, content, agent_name, employee_id)
            self._repository.generate_ticket_reference(db, ticket_id)
            self._repository.set_start_time(db, ticket_id)
            
        failed_message = f"Agent encountered a problem:\n{error_details}"
        self._repository.add_followup(db, ticket_id, failed_message)
        self._repository.update_content(db, ticket_id, failed_message)
        self._repository.update_status(db, ticket_id, "Failed")
        self._repository.set_end_time(db, ticket_id)
        return ticket_id

    def handle_agent_completed(self, db: Session, agent_name: str, employee_id: str):
        ticket_id = self._repository.find_ticket_id_for_agent_run(db, agent_name, employee_id)
        if not ticket_id:
            return None

        ticket = self._repository.get_ticket_by_id(db, ticket_id)

        if ticket["status"].upper() == "FAILED":
            blocked_message = (
                f"Agent '{agent_name}' reported completion, but this ticket had a prior problem. "
                f"Manual review required before closing."
            )
            self._repository.add_followup(db, ticket_id, blocked_message)
            self._repository.update_content(db, ticket_id, blocked_message)
            return ticket_id

        closed_message = f"Agent '{agent_name}' completed processing successfully. Ticket closed."
        self._repository.add_followup(db, ticket_id, closed_message)
        self._repository.update_content(db, ticket_id, closed_message)
        self._repository.close_ticket(db, ticket_id)
        self._repository.set_end_time(db, ticket_id)
        return ticket_id