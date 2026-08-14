"""
Orchestration Dashboard summary endpoint (PDD Section 9 -- "New (POC)").

Returns the exact shape frontend/types/onboarding.ts's DashboardData
expects (stats / integrationCoverage / slaWarning / departments /
systemHealth / ticketStatus) -- previously dashboard.service.ts stubbed
most of these to empty/zero because /dashboard/summary only exposed
employee/ticket/provisioning counts in a different shape (see that
file's now-stale TODO comments). Every field below is computed from a
real backend source (DB rows or config_data/provisioning_matrix.json);
fields with a real source that legitimately hold no data (e.g. no
ticket currently breaching SLA) come back null with a comment saying
so -- not an invented value.
"""
import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Employee, Ticket, ProvisioningRecord, AgentTicket
from app.config import get_provisioning_matrix
from app.orchestrators.health_check_orchestrator import get_cached_health
from app.orchestrators.onboarding_orchestrator import AGENT_DISPLAY_NAMES
from app.services.action_counter import get_static_action_counts

# Our 4 real connector systems -> the provisioning agent_key AgentTicket
# rows are logged under (AGENT_DISPLAY_NAMES maps that agent_key to the
# agent_name string actually stored on AgentTicket.agent_name).
_SYSTEM_AGENT_KEYS = {
    "keycloak": "identity",
    "mailu": "email",
    "kimai": "time_billing",
    "openkm": "document_management",
}
MOCK_AGENTS = {
    "access_recommendation": "Access Recommendation Agent",
    "legal_research": "Legal Research Agent",
    "productivity_suite": "Productivity Suite Agent",
    "network_access": "Network Access Agent",
    "ticketing_itsm": "Ticketing/ITSM Agent",
    "audit_software": "Audit Software Agent",
}
# Inverse lookup: AgentTicket.agent_name (display string, e.g. "Identity
# Agent") -> the system key ("keycloak") get_static_action_counts() uses,
# so a ticket row can be matched back to its connector's static action count.
_AGENT_NAME_TO_SYSTEM_KEY = {
    AGENT_DISPLAY_NAMES[provisioning_key]: system_key
    for system_key, provisioning_key in _SYSTEM_AGENT_KEYS.items()
}

_AGENT_NAME_TO_SYSTEM_KEY.update({
    agent_name: system_key
    for system_key, agent_name in MOCK_AGENTS.items()
})
router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _build_stats(db: Session) -> dict:
    """total is the employee headcount; the other four counts classify
    each employee (not each ProvisioningRecord row) by rolling up all of
    that employee's provisioning item statuses: all completed ->
    completed, no records or all not_started -> notStarted, all failed
    -> failed, anything else (any in_progress, or a completed/failed mix
    with no in_progress row) -> inProgress since the employee's
    provisioning is neither finished nor fully stalled."""
    total = db.query(Employee).count()

    rows = db.query(ProvisioningRecord.employee_id, ProvisioningRecord.status).all()
    statuses_by_employee: dict[str, list[str]] = {}
    for employee_id, status in rows:
        statuses_by_employee.setdefault(employee_id, []).append(status)

    completed = in_progress = failed = not_started = 0
    for (employee_id,) in db.query(Employee.id).all():
        statuses = statuses_by_employee.get(employee_id, [])
        if not statuses or all(s == "not_started" for s in statuses):
            not_started += 1
        elif all(s == "completed" for s in statuses):
            completed += 1
        elif all(s == "failed" for s in statuses):
            failed += 1
        else:
            in_progress += 1

    return {
        "total": total,
        "completed": completed,
        "inProgress": in_progress,
        "failed": failed,
        "notStarted": not_started,
    }



def _format_duration(since: datetime.datetime) -> str:
    minutes_total = max(int((datetime.datetime.utcnow() - since).total_seconds() // 60), 0)
    hours, minutes = divmod(minutes_total, 60)
    return f"{hours}h {minutes:02d}m"


def _build_sla_warning(db: Session) -> dict:
    """Longest-outstanding SLA breach still open. sla_flagged_at is set
    once by the Monitoring Agent when a ticket's been Pending > 4h (see
    models/employee.py's Ticket docstring) -- oldest flag first."""
    ticket: Ticket | None = (
        db.query(Ticket)
        .filter(Ticket.sla_flagged_at.isnot(None), Ticket.status != "Closed")
        .order_by(Ticket.sla_flagged_at.asc())
        .first()
    )
    if not ticket:
        # Real query, genuinely no rows -- not a stand-in for missing data.
        return {"ticketId": None, "employee": None, "department": None, "item": None, "duration": None}

    employee = db.query(Employee).filter(Employee.id == ticket.employee_id).first()
    return {
        "ticketId": ticket.ticket_id,
        "employee": employee.name if employee else None,
        "department": employee.department if employee else None,
        "item": ticket.provisioning_item,
        "duration": _format_duration(ticket.sla_flagged_at),
    }


def _build_departments(db: Session) -> list[dict]:
    dept_rows = db.query(Employee.department, func.count(Employee.id)).group_by(Employee.department).all()

    open_ticket_rows = (
        db.query(Employee.department, func.count(Ticket.id))
        .join(Ticket, Ticket.employee_id == Employee.id)
        .filter(Ticket.status != "Closed")
        .group_by(Employee.department)
        .all()
    )
    open_tickets_by_dept = {dept: count for dept, count in open_ticket_rows}

    # avgCompletion == % of this department's ProvisioningRecord rows that
    # are "completed" -- aggregated in Python rather than SQL so it doesn't
    # depend on a specific dialect's CASE/boolean-sum behavior for a POC-sized table.
    provisioning_rows = (
        db.query(Employee.department, ProvisioningRecord.status)
        .join(ProvisioningRecord, ProvisioningRecord.employee_id == Employee.id)
        .all()
    )
    totals: dict[str, int] = {}
    completed: dict[str, int] = {}
    for dept, status in provisioning_rows:
        totals[dept] = totals.get(dept, 0) + 1
        if status == "completed":
            completed[dept] = completed.get(dept, 0) + 1
    completion_by_dept: dict[str, int] = {dept: round(completed.get(dept, 0) / total * 100) for dept, total in totals.items()}

    return [
        {
            "name": dept,
            "employees": count,
            "openTickets": open_tickets_by_dept.get(dept, 0),
            "avgCompletion": completion_by_dept.get(dept, 0),
        }
        for dept, count in dept_rows
    ]

def get_action_count(db: Session) -> dict:
    employee_count = db.query(Employee).count()
    return {agent: count * employee_count for agent, count in get_static_action_counts().items()}



def get_total_action(db: Session) -> dict:
    agent_names = list(_AGENT_NAME_TO_SYSTEM_KEY.keys())

    rows = (
        db.query(
            AgentTicket.agent_name,
            AgentTicket.status,
            func.count(AgentTicket.ticket_id),
        )
        .filter(AgentTicket.agent_name.in_(agent_names))
        .group_by(AgentTicket.agent_name, AgentTicket.status)
        .all()
    )

    # Each connector's static per-employee action count, keyed by system
    # key ("keycloak"/"mailu"/"kimai"/"openkm").
    static_counts = get_static_action_counts()

    total = 0
    completed = 0
    in_progress = 0
    not_started = 0
    failed = 0

    for agent_name, status, count in rows:

        # Map this ticket's agent_name (e.g. "Identity Agent") back to
        # its system key ("keycloak") to look up its static action count.
# Map agent name to its system key.
        system_key = _AGENT_NAME_TO_SYSTEM_KEY.get(agent_name)

        # Functional agents use their configured static action count.
        if system_key in _SYSTEM_AGENT_KEYS:
            action_count = static_counts.get(system_key, 0)

        # Mock agents always represent 1 action per ticket.
        elif system_key in MOCK_AGENTS:
            action_count = 1

        else:
            action_count = 0        # Number of actions represented by these tickets
        actions = action_count * count

        # Add to overall total
        total += actions

        # Add to the appropriate status total -- AgentTicket.status is
        # one of New/Processing/Failed/Closed (see ticket_repository.py).
        if status == "Closed":
            completed += actions

        elif status == "Processing":
            in_progress += actions

        elif status == "New":
            not_started += actions

        elif status == "Failed":
            failed += actions

    return {
        "total": total,
        "completed": completed,
        "inProgress": in_progress,
        "notStarted": not_started,
        "failed": failed,
    }

def _build_system_health() -> list[dict]:
    """Cached Health Check Orchestrator sweep (orchestrators/
    health_check_orchestrator.py) -- never triggers a live sweep from a
    router, per that module's own caching requirement. Empty list if the
    background loop hasn't completed its first sweep yet."""
    health = get_cached_health()
    return [{"name": d.get("name"), "status": d.get("status")} for d in health.get("systemHealthDetail", [])]


def _build_ticket_status(db: Session) -> dict:
    rows = db.query(Ticket.status, func.count(Ticket.id)).group_by(Ticket.status).all()
    by_status = {status: count for status, count in rows}
    return {
        "open": by_status.get("Open", 0),
        "inProgress": by_status.get("In Progress", 0),
        "pending": by_status.get("Pending", 0),
        "closed": by_status.get("Closed", 0),
    }


# @router.get("/summary")
# def get_dashboard_summary(db: Session = Depends(get_db)):
#     return {
#         "stats": _build_stats(db),
#         "integrationcoverage": _build_integration_coverage(),
#         "slawarning": _build_sla_warning(db),
#         "departments": _build_departments(db),
#         "systemhealth": _build_system_health(),
#         "actioncounts": get_action_count(db),
#         "totalactions": get_total_action(db),
#         "ticketstatus": _build_ticket_status(db),
#     }


# Same fields as /summary, each split into its own endpoint -- every one
# below reuses the exact same builder function /summary calls, so the two
# can never drift out of sync with each other.
@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    return _build_stats(db)



@router.get("/sla-warning")
def get_sla_warning(db: Session = Depends(get_db)):
    return _build_sla_warning(db)


@router.get("/departments")
def get_departments(db: Session = Depends(get_db)):
    return _build_departments(db)


@router.get("/system-health")
def get_system_health(db: Session = Depends(get_db)):
    return {
        "agenthealth": _build_system_health(),
        "actioncount": get_action_count(db)
    }

@router.get("/total-actions")
def get_total_actions_endpoint(db: Session = Depends(get_db)):
    return get_total_action(db)


@router.get("/ticket-status")
def get_ticket_status(db: Session = Depends(get_db)):
    return _build_ticket_status(db)
