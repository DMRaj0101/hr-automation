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
from app.models import AgentHealth
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
