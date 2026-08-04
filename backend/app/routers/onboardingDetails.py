"""
Onboarding Detail screen -- read-only endpoint that reshapes existing
Employee, ProvisioningRecord, Ticket, and cached System Health rows into
the shape the frontend's onboarding detail page expects. No new business
logic: every value is either read straight off an existing model column,
a simple status-vocabulary lookup (same style routers/employeeDirectory.py
already uses), or a presentation-layer combination of existing rows.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Employee, ProvisioningRecord, Ticket
from app.orchestrators import health_check_orchestrator

router = APIRouter(prefix="/onboarding-details", tags=["onboarding-details"])

# Employee.status ("registered" | "provisioning" | "active") -> the
# onboarding-status vocabulary the frontend already styles in
# lib/utils.ts's statusColorMap (Onboarding / In Progress / Completed).
_STATUS_LABELS = {
    "registered": "Onboarding",
    "provisioning": "In Progress",
    "active": "Completed",
}

# System only ever runs one workflow type -- offboarding was removed
# entirely (see models/employee.py's module docstring: "offboarding
# models... are gone"). Not mock data, just the app's one supported type.
_WORKFLOW_TYPE = "Onboarding"


def _provisioning_alert(record: ProvisioningRecord) -> dict:
    """kind="dismiss" matches AlertCard.tsx's Retry Now / Dismiss actions --
    the natural fit for a failed ProvisioningRecord, which is exactly what
    agents/monitoring_agent.py already retries against retry_count."""
    label = record.software_name or record.provisioning_item
    return {
        "id": f"prov-{record.id}",
        "severity": "critical",
        "title": f"{label} Failed",
        "body": record.error_detail
        or f"{record.provisioning_item} failed after {record.retry_count} attempt(s).",
        "kind": "dismiss",
    }


def _ticket_alert(ticket: Ticket) -> dict:
    """kind="view" matches AlertCard.tsx's View Details action -- for a
    ticket someone needs to look at. SLA-breached tickets (sla_flagged_at
    set by the Monitoring Agent per models/employee.py's Ticket docstring)
    get bumped to critical instead of high."""
    label = ticket.software_name or ticket.provisioning_item
    if ticket.sla_flagged_at is not None:
        return {
            "id": f"ticket-{ticket.ticket_id}",
            "severity": "critical",
            "title": f"{label} SLA Breached",
            "body": ticket.notes
            or f"Ticket {ticket.ticket_id} (assigned to {ticket.assigned_team}) has been "
            f"pending past the SLA window.",
            "kind": "view",
        }
    return {
        "id": f"ticket-{ticket.ticket_id}",
        "severity": "high",
        "title": f"{label} Pending",
        "body": ticket.notes
        or f"Ticket {ticket.ticket_id} is awaiting {ticket.assigned_team}.",
        "kind": "view",
    }


def _health_alert(detail: dict) -> dict:
    """kind="ack" matches AlertCard.tsx's Acknowledge action -- informational,
    not tied to a specific record. Reuses health_check_orchestrator's cache
    only (get_cached_health()), per that module's own caching requirement --
    never triggers a live sweep from a router."""
    name = detail.get("name")
    status = detail.get("status")
    severity = "critical" if status == "Down" else "medium"
    body = f"{name} is currently {status}."
    if status == "Degraded":
        body = f"{name} latency is {detail.get('latency')}, above the healthy threshold."
    return {
        "id": f"health-{name}",
        "severity": severity,
        "title": f"{name} {status}",
        "body": body,
        "kind": "ack",
    }


def _build_alerts(db: Session, employee_id: str) -> list[dict]:
    """Aggregates failed provisioning + pending/SLA-breached tickets for
    this employee, plus any non-Operational entry from the cached system
    health sweep -- combined here only, per instructions."""
    alerts = [
        _provisioning_alert(r)
        for r in db.query(ProvisioningRecord)
        .filter(
            ProvisioningRecord.employee_id == employee_id,
            ProvisioningRecord.status == "failed",
        )
        .all()
    ]

    alerts += [
        _ticket_alert(t)
        for t in db.query(Ticket)
        .filter(Ticket.employee_id == employee_id, Ticket.status == "Pending")
        .all()
    ]

    health = health_check_orchestrator.get_cached_health()
    alerts += [
        _health_alert(d)
        for d in health.get("systemHealthDetail", [])
        if d.get("status") != "Operational"
    ]

    return alerts


@router.get("/{employee_id}")
def get_onboarding_details(employee_id: str, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    return {
        "status": _STATUS_LABELS.get(employee.status, employee.status),
        "type": _WORKFLOW_TYPE,
        "startDate": employee.joining_date,
        # TODO: no estimated-completion-date field exists anywhere
        # (OnboardingTracker/ProvisioningRecord only record actual
        # timestamps) -- populate once such a field/orchestrator exists.
        "plannedCompletion": None,
        # TODO: depends on plannedCompletion above; left None rather than
        # inventing a days-remaining estimate with no backing date.
        "daysRemaining": None,
        "alerts": _build_alerts(db, employee_id),
    }
