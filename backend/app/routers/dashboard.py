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
from app.models import Employee, Ticket, ProvisioningRecord
from app.config import get_provisioning_matrix
from app.orchestrators.health_check_orchestrator import get_cached_health

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _build_stats(db: Session) -> dict:
    rows = db.query(ProvisioningRecord.status, func.count(ProvisioningRecord.id)).group_by(
        ProvisioningRecord.status
    ).all()
    by_status = {status: count for status, count in rows}
    return {
        "total": db.query(ProvisioningRecord).count(),
        "completed": by_status.get("completed", 0),
        "inProgress": by_status.get("in_progress", 0),
        "failed": by_status.get("failed", 0),
    }


def _build_integration_coverage() -> dict:
    """Real vs Mock straight off provisioning_matrix.json's own `status`
    field (functional == real API call to a real system, mock == ticket
    only, per that file's _comment) -- the project's actual source of
    truth for which downstream systems are wired for real."""
    matrix = get_provisioning_matrix()
    real_systems: set[str] = set()
    mock_systems: set[str] = set()
    for items in matrix.values():
        if not isinstance(items, list):
            continue
        for item in items:
            names = {n.strip() for n in (item.get("software") or "").split(",") if n.strip()}
            if item.get("status") == "functional":
                real_systems |= names
            else:
                mock_systems |= names
    mock_systems -= real_systems  # a system counts as real if it's functional for any role

    real_count, mock_count = len(real_systems), len(mock_systems)
    total = real_count + mock_count
    real_pct = round(real_count / total * 100) if total else 0
    return {
        "realCount": real_count,
        "mockCount": mock_count,
        "realPct": real_pct,
        "mockPct": (100 - real_pct) if total else 0,
        "realSystems": sorted(real_systems),
        "mockSystems": sorted(mock_systems),
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


@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    return {
        "stats": _build_stats(db),
        "integrationCoverage": _build_integration_coverage(),
        "slaWarning": _build_sla_warning(db),
        "departments": _build_departments(db),
        "systemHealth": _build_system_health(),
        "ticketStatus": _build_ticket_status(db),
    }
