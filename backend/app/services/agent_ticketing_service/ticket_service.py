from services.agent_ticketing_service import TicketRepository


class TicketService:
    """Business logic: translates agent status events into local ticket actions."""

    def __init__(self, repository: TicketRepository):
        self._repository = repository

    def handle_agent_started(self, agent_name: str, employee_id: str) -> int:
        title = f"Agent Onboarding Run - {agent_name} - Employee {employee_id}"
        content = f"Agent '{agent_name}' started onboarding processing for employee {employee_id}."
        ticket_id = self._repository.create_ticket(title, content, agent_name, employee_id)
        self._repository.update_status(ticket_id, "PROCESSING")
        return ticket_id

    def handle_agent_problem(self, agent_name: str, employee_id: str, error_details: str):
        ticket_id = self._repository.find_ticket_id_for_agent_run(agent_name, employee_id)
        if ticket_id:
            self._repository.add_followup(ticket_id, f"Agent encountered a problem:\n{error_details}")
            self._repository.update_status(ticket_id, "PROBLEM")
        return ticket_id

    def handle_agent_completed(self, agent_name: str, employee_id: str):
        ticket_id = self._repository.find_ticket_id_for_agent_run(agent_name, employee_id)
        if not ticket_id:
            return None

        ticket = self._repository.get_ticket_by_id(ticket_id)

        if ticket["status"] == "PROBLEM":
            self._repository.add_followup(
                ticket_id,
                f"Agent '{agent_name}' reported completion, but this ticket had a prior problem. "
                f"Manual review required before closing."
            )
            return ticket_id

        self._repository.add_followup(ticket_id, f"Agent '{agent_name}' completed processing successfully.")
        self._repository.close_ticket(ticket_id)
        return ticket_id