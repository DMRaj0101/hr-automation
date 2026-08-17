"""
Live operational data for the Knowledge Agent's second capability:
answering questions about tickets/employees/system health from real
DB state, as opposed to hr_assistant's FAISS policy-document path.

system_health is read from the same cached Health Check Orchestrator
sweep the System Health dashboard uses (health_check_orchestrator.
get_cached_health()) -- NOT derived from ProvisioningRecord.status.
A connector failure gets recorded as ProvisioningRecord.status ==
"in_progress" (retryable) rather than "failed" until the Monitoring
Agent exhausts retries (see onboarding_orchestrator.py), so deriving
"down" from status == "failed" alone made the chatbot report systems
as healthy while they were actually stuck/unreachable and the real
dashboard was already showing them Down. Reusing the same cache both
fixes that and guarantees the chatbot never disagrees with the
dashboard about which systems are up.
"""
from sqlalchemy.orm import Session
from app.models import Employee, Ticket
from app.models.agent_monitor_model import AgentTicket
from app.orchestrators.health_check_orchestrator import get_cached_health


def get_ops_context(db: Session) -> dict:
    employees = db.query(Employee).all()
    tickets = db.query(Ticket).all()
    agent_tickets = db.query(AgentTicket).all()

    employees_data = [
        {
            "employee_id": e.employee_id,
            "name": e.name,
            "department": e.department,
            "status": e.status,
        }
        for e in employees
    ]

    tickets_data = [
        {
            "ticket_id": t.ticket_id,
            "employee_id": t.employee_id,
            "provisioning_item": t.provisioning_item,
            "software_name": t.software_name,
            "assigned_team": t.assigned_team,
            "status": t.status,
        }
        for t in tickets
    ]

    agent_tickets_data = [
        {
            "ticket_reference": t.ticket_reference,
            "title": t.title,
            "employee_id": t.employee_id,
            "agent_name": t.agent_name,
            "status": t.status,
        }
        for t in agent_tickets
    ]

    health = get_cached_health()
    system_health_data = [
        {
            "name": d.get("name"),
            "status": d.get("status"),  # Operational | Degraded | Down
            "error": d.get("error"),
        }
        for d in health.get("systemHealthDetail", [])
    ]

    return {
        "employees": employees_data,
        "tickets": tickets_data,
        "agent_tickets": agent_tickets_data,
        "system_health": system_health_data,
    }
