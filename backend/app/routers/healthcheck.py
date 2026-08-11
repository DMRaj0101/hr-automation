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
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AgentHealth, Employee, Ticket, AuditLog
from app.agents.monitoring_agent import SLA_PENDING_HOURS
from app.orchestrators import health_check_orchestrator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/system-health", tags=["system-health"])

# Window for the latencyHistory24h / uptimePercentage fields below.
_UPTIME_WINDOW_HOURS = 24


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
    employee_name=None rather than being silently dropped."""
    recent_activity = (
        db.query(AuditLog, Employee)
        .outerjoin(Employee, AuditLog.employee_id == Employee.id)
        .order_by(AuditLog.timestamp.desc())
        .limit(10)
        .all()
    )
    return {
        "recent_activity": [
            {
                "timestamp": _format_dt(a.timestamp),
                "agent": a.agent,
                "action": a.action,
                "detail": a.detail,
                "employee_name": employee.name if employee else None,
                "employee_id": employee.employee_id if employee else None,
            }
            for a, employee in recent_activity
        ]
    }

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
        .filter(Ticket.status == "Pending", Ticket.sla_flagged_at.isnot(None))
        .order_by(Ticket.sla_flagged_at.asc())
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
