"""
Backs the frontend's System Health panel. Read-only by design: GET
/system-health only ever returns whatever the Health Check Orchestrator's
background loop last cached (see
orchestrators/health_check_orchestrator.py's module docstring -- the API
layer must never trigger a live sweep on a page load). POST
/system-health/refresh is the one deliberate escape hatch for an
on-demand manual refresh (e.g. an admin "Refresh now" button), calling
the same orchestrator function the background loop itself calls.
"""
import datetime
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import case
from sqlalchemy.orm import Session
from app.services.action_counter import get_static_action_counts
from sqlalchemy import func
from app.database import get_db
from app.models import AgentHealth, Employee, Ticket, AuditLog,AgentTicket,ProvisioningRecord
from app.agents.monitoring_agent import SLA_PENDING_HOURS
from app.orchestrators import health_check_orchestrator
from app.orchestrators.onboarding_orchestrator import AGENT_DISPLAY_NAMES
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/system-health", tags=["system-health"])

# Window for the latencyHistory24h / uptimePercentage fields below.
_UPTIME_WINDOW_HOURS = 24

EXCLUDED_AGENTS = [
    "Monitoring Agent",
    "Health Check Agent",
]

_AGENT_DISPLAY_TO_KEY = {display: key for key, display in AGENT_DISPLAY_NAMES.items()}

_SYSTEM_AGENT_KEYS = {
    "keycloak": "identity",
    "mailu": "email",
    "kimai": "time_billing",
    "openkm": "document_management",
}

# get_action_count()'s system keys -> the exact display name used in
# _HEALTH_CHECKS/systemHealthDetail (health_check_orchestrator.py), so the
# frontend can key off SystemHealthDetail.name for both latency/uptime and
# action counts the same way.
_SYSTEM_KEY_TO_HEALTH_NAME = {
    "keycloak": "Keycloak",
    "mailu": "MailU",
    "kimai": "Kimai",
    "openkm": "OpenKM",
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


# SQL CASE translating AuditLog.agent (a display name, e.g. "Email Agent")
# into the agent_key ProvisioningRecord.agent_key actually stores (e.g.
# "email") -- _AGENT_DISPLAY_TO_KEY itself is a plain Python dict and can't
# be evaluated against a column expression inside a join condition.
_AGENT_DISPLAY_TO_KEY_CASE = case(_AGENT_DISPLAY_TO_KEY, value=AuditLog.agent)


def _latency_history_and_uptime(db: Session) -> tuple[dict[str, list], dict[str, float]]:
    """
    Per-agent latency readings and uptime percentage over the last
    _UPTIME_WINDOW_HOURS, read straight from the AgentHealth history
    table (one row per agent per completed sweep -- see
    health_check_orchestrator._persist_health()). "Up" counts any status
    other than "Down" (Operational and Degraded both mean the
    integration responded).
    """
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(hours=_UPTIME_WINDOW_HOURS)
    rows = (
        db.query(AgentHealth)
        .filter(AgentHealth.last_heartbeat >= cutoff)
        .order_by(AgentHealth.last_heartbeat.asc())
        .all()
    )

    latency_history: dict[str, list] = {}
    totals: dict[str, int] = {}
    up_counts: dict[str, int] = {}
    for row in rows:
        latency_history.setdefault(row.agent, []).append(row.latency_ms)
        totals[row.agent] = totals.get(row.agent, 0) + 1
        if row.status != "Down":
            up_counts[row.agent] = up_counts.get(row.agent, 0) + 1

    uptime_percentage = {
        agent: round(100 * up_counts.get(agent, 0) / total, 2)
        for agent, total in totals.items()
    }
    return latency_history, uptime_percentage
def _format_dt(value):

    return value.strftime("%d-%m-%Y %H:%M:%S") if value else None

def _recent_logs(db: Session) -> dict:
    """System-wide recent activity feed (not scoped to one employee --
    this endpoint has no employee_id path/query param), for the System
    Health panel's recent-logs view. Same shape as profile.py's
    per-employee recent_activity block, just unfiltered.

    Left-outer-joined to Employee (not an inner join) since
    AuditLog.employee_id is nullable -- some log rows aren't tied to a
    specific employee, and those should still show up with
    employee_name=None rather than being silently dropped. Same reasoning
    for AgentTicket and ProvisioningRecord below -- an inner join would
    silently drop any AuditLog row whose agent never opened a ticket or
    provisioning record (e.g. Ticket Generation Agent's own log rows),
    which is exactly the "rather than being silently dropped" case this
    docstring already calls out.

    ProvisioningRecord has no direct FK to AuditLog and no agent-name
    column (only agent_key, e.g. "email" vs AuditLog.agent's "Email
    Agent") -- joined via employee_id + _AGENT_DISPLAY_TO_KEY_CASE
    translating AuditLog.agent into the matching agent_key. A given
    employee can in principle have more than one ProvisioningRecord row
    for the same agent_key (functional_items in onboarding_orchestrator.py
    is a list, not a 1:1 map), so this can still fan out one AuditLog row
    into multiple result rows -- deduped below by keeping the
    most-recently-attempted match per AuditLog row."""
    from sqlalchemy import and_
    rows = (
        db.query(
            AuditLog,
            Employee,
            AgentTicket,
            ProvisioningRecord,
        )
        .outerjoin(
            Employee,
            AuditLog.employee_id == Employee.id
        )
        .outerjoin(
            AgentTicket,
            and_(
                Employee.employee_id == AgentTicket.employee_id,
                AuditLog.agent == AgentTicket.agent_name,
            )
        )
        .outerjoin(
            ProvisioningRecord,
            and_(
                Employee.id == ProvisioningRecord.employee_id,
                AuditLog.agent == ProvisioningRecord.agent_key,
            )
        )
        .filter(
            ~AuditLog.agent.in_(EXCLUDED_AGENTS)
        )
        .order_by(
            AuditLog.timestamp.desc(),
            ProvisioningRecord.last_attempted_at.desc(),
        )
        .limit(50)
        .all()
    )

    # Dedup: an AuditLog row can still match more than one ProvisioningRecord
    # (see docstring above) -- keep only the first (most-recently-attempted,
    # per the order_by above) match per distinct AuditLog row, then cap at 10.
    seen_audit_ids: set[str] = set()
    deduped: list[tuple] = []
    for a, employee, agent_ticket, provisioning_record in rows:
        if a.id in seen_audit_ids:
            continue
        seen_audit_ids.add(a.id)
        deduped.append((a, employee, agent_ticket, provisioning_record))
        if len(deduped) == 10:
            break

    return {
        "recent_activity": [
            {
                "timestamp": _format_dt(a.timestamp),
                "agent": a.agent,
                "action": a.action,
                "detail": a.detail,
                "agent_ticket_id": agent_ticket.ticket_reference if agent_ticket else None,
                "status": agent_ticket.status if agent_ticket else None,
                "employee_name": employee.name if employee else None,
                "employee_id": employee.employee_id if employee else None,
                "retry_count": provisioning_record.retry_count if provisioning_record else None,
                "context": provisioning_record.context if provisioning_record else None,
            }
            for a, employee, agent_ticket, provisioning_record in deduped
        ]
    }

def get_action_count(db: Session) -> dict:
    """For each of the 4 real connector agents (keycloak/mailu/kimai/
    openkm): totalActions is the static per-call count x employee
    headcount (how many actions this agent is expected to perform
    across every employee); successRate is the % of this agent's
    AgentTicket rows recorded so far that are Closed."""
    employee_count = db.query(Employee).count()
    static_counts = get_static_action_counts()

    rows = (
        db.query(AgentTicket.agent_name, AgentTicket.status, func.count(AgentTicket.ticket_id))
        .filter(AgentTicket.agent_name.in_(_AGENT_NAME_TO_SYSTEM_KEY.keys()))
        .group_by(AgentTicket.agent_name, AgentTicket.status)
        .all()
    )

    tickets_total_by_agent: dict[str, int] = {}
    tickets_closed_by_agent: dict[str, int] = {}
    for agent_name, status, count in rows:
        system_key = _AGENT_NAME_TO_SYSTEM_KEY.get(agent_name)
        if system_key not in static_counts:
            continue  # not one of the 4 real connector agents (e.g. a mock-item agent)
        tickets_total_by_agent[system_key] = tickets_total_by_agent.get(system_key, 0) + count
        if status == "Closed":
            tickets_closed_by_agent[system_key] = tickets_closed_by_agent.get(system_key, 0) + count

    result = {}
    for agent, static_count in static_counts.items():
        tickets_total = tickets_total_by_agent.get(agent, 0)
        tickets_closed = tickets_closed_by_agent.get(agent, 0)
        success_rate = round(tickets_closed / tickets_total * 100, 2) if tickets_total else 0.0
        health_name = _SYSTEM_KEY_TO_HEALTH_NAME.get(agent, agent)
        result[health_name] = {
            "totalActions": static_count * employee_count,
            "successRate": success_rate,
        }
    return result



@router.get("/recent-logs")
def get_recent_logs(db: Session = Depends(get_db)):
    return _recent_logs(db)

@router.get("")
def get_system_health(db: Session = Depends(get_db)):
    """Returns the latest cached health sweep, plus each agent's last-24h
    latency history and uptime percentage read from the AgentHealth
    table. The cached sweep itself never triggers a new one -- see
    health_check_orchestrator.get_cached_health()'s docstring; the
    latency/uptime fields are a read of already-persisted history rows,
    not a live check, so this stays within that same read-only contract."""
    try:
        result = dict(health_check_orchestrator.get_cached_health())
        latency_history, uptime_percentage = _latency_history_and_uptime(db)
        result["latencyHistory24h"] = latency_history
        result["uptimePercentage"] = uptime_percentage
        result["actionCounts"] = get_action_count(db)
        return result
    except Exception as exc:
        logger.error("Failed to read cached system health: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to read cached system health") from exc


@router.post("/refresh")
def refresh_system_health():
    """Manually triggers an immediate health sweep (bypassing the 30-minute
    schedule) and returns the freshly updated cached result. Same
    orchestrator function (refresh_health_cache()) the background loop
    calls on its own schedule -- this just calls it on demand."""
    try:
        return health_check_orchestrator.refresh_health_cache()
    except Exception as exc:
        logger.error("Failed to refresh system health: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to refresh system health") from exc



def _get_sla_warnings(db: Session) -> list[dict]:
    """
    Currently-breaching SLA tickets, for the Monitoring Agent Console's
    "SLA Warning" panel. Filters on status == "Pending" (not just
    sla_flagged_at.isnot(None) like monitoring.py's monitoring_console()
    does) so a ticket that breached but has since moved out of Pending
    (e.g. Closed) drops off this list instead of showing stale.

    breach_cause is hardcoded to "human_pending", not actually
    classified per-ticket -- the other two enum values from the original
    spec (agent_stuck_retry / agent_not_escalated) describe
    ProvisioningRecord-level agent-retry states, but a Ticket only ever
    reaches "Pending" (the one status _check_sla_breaches() in
    monitoring_agent.py flags) once a human team owns it -- by that
    point the agent-retry loop is no longer what's blocking it. No
    logic exists anywhere in this codebase to distinguish
    agent_stuck_retry from agent_not_escalated at the ProvisioningRecord
    level either, so those two values are never produced here; this
    endpoint only reports the one cause it can actually back with real
    data.
    """
    rows = (
        db.query(Ticket, Employee)
        .join(Employee, Ticket.employee_id == Employee.id)
        .filter(Ticket.status != "Closed", Ticket.sla_flagged_at.isnot(None))
        .order_by(Ticket.sla_flagged_at.desc())
        .limit(1)   
        .all()
    )
    return [
        {
            "ticket_id": ticket.ticket_id,
            "employee_name": employee.name,
            "system": ticket.provisioning_item,
            "breach_cause": "human_pending",
            "breach_since": ticket.status_changed_at,
            "sla_hours": SLA_PENDING_HOURS,
        }
        for ticket, employee in rows
    ]


@router.get("/sla-warnings")
def get_sla_warnings(db: Session = Depends(get_db)):
    """Read-only, same convention as GET /system-health above -- reads
    already-persisted Ticket rows (sla_flagged_at is set by
    monitoring_agent.py's background poll loop), never runs a live
    check on request."""
    try:
        return {"slaWarnings": _get_sla_warnings(db)}
    except Exception as exc:
        logger.error("Failed to read SLA warnings: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to read SLA warnings") from exc