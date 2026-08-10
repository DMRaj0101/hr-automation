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
from app.models import Employee, ProvisioningRecord, Ticket, AgentTicket
from app.orchestrators import health_check_orchestrator
from app.orchestrators.onboarding_orchestrator import AGENT_DISPLAY_NAMES

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
 
 
FUNCTIONAL_AGENT_KEYS = ["Identity Agent", "Email Agent", "Time & Billing Agent", "Document Management Agent"]

# AgentTicket.agent_name (display name, e.g. "Time & Billing Agent") ->
# ProvisioningRecord.agent_key (e.g. "time_billing"). Reuses
# onboarding_orchestrator.AGENT_DISPLAY_NAMES (the source of truth for
# agent_key -> display name) instead of re-deriving it -- comparing the
# display name directly against agent_key (as this file previously did)
# never matches anything, since "Identity Agent" != "identity".
_AGENT_DISPLAY_TO_KEY = {display: key for key, display in AGENT_DISPLAY_NAMES.items()}


def _format_dt(value):

    return value.strftime("%d-%m-%Y %H:%M:%S") if value else None

from datetime import datetime, timedelta

def _planned_date(joining_date):
    if not joining_date:
        return None

    if isinstance(joining_date, str):
        joining_date = datetime.strptime(joining_date, "%Y-%m-%d").date()

    return joining_date - timedelta(days=3)


def _days_remaining(joining_date):
    """
    Returns the number of days remaining until the planned
    completion date.
    """
    planned_date = _planned_date(joining_date)

    if not planned_date:
        return None

    today = datetime.now().date()

    # If planned_date is a datetime, convert it to a date
    if hasattr(planned_date, "date"):
        planned_date = planned_date.date()

    return (planned_date - today).days

    


@router.get("/{employee_id}/provisional-status")

def provisional_status(employee_id: str, db: Session = Depends(get_db)):

    """Functional-item provisioning status per employee, shaped for the

    Provisional Status screen. platform/startTime/endtime/credentials.username

    are read straight off ProvisioningRecord/Employee (null if the backend

    row/column has no value yet); ticketID, ticketStatus, note are read

    straight off the matching AgentTicket; credentials.password is mocked

    since this codebase has no credential-storage concept."""

    employees = (

        db.query(Employee)

        .filter(Employee.employee_id == employee_id)

        .all()

    )
 
    result = {}

    for employee in employees:
        result[employee.employee_id] = []

        username = employee.name  # real
        password = username.replace(" ", "") if username else None  # mock -- no credential storage in the schema

        agent_details = (
            db.query(AgentTicket)
            .filter(AgentTicket.employee_id == employee.employee_id)
            .filter(AgentTicket.agent_name.in_(FUNCTIONAL_AGENT_KEYS))
            .all()
        )

        for agent in agent_details:
            agent_key = _AGENT_DISPLAY_TO_KEY.get(agent.agent_name)

            provisioning_records = (
                db.query(ProvisioningRecord)
                .filter(ProvisioningRecord.employee_id == employee.id)
                .filter(ProvisioningRecord.agent_key == agent_key)
                .all()
            )

            result[employee.employee_id].extend(
                {
                    "platform": record.software_name,  # real
                    "ticketID": agent.ticket_id,
                    "ticketStatus": agent.status,
                    "startTime": _format_dt(record.created_at),
                    "endtime": _format_dt(record.completed_at),
                    "credentials": {
                        "username": username,  # real
                        "password": record.external_ref,  # mock
                    },
                    "note": agent.content,
                }
                for record in provisioning_records
            )

    return {"ProvisionalStatus": result}

@router.get("/{employee_id}")

def get_onboarding_details(employee_id: str, db: Session = Depends(get_db)):

    employee = db.query(Employee).filter(Employee.employee_id == employee_id).first()

    if not employee:

        raise HTTPException(status_code=404, detail="Employee not found")
 
    return {

        "status": _STATUS_LABELS.get(employee.status, employee.status),

        "type": _WORKFLOW_TYPE,

        "startDate": employee.joining_date,
        "plannedCompletion": _planned_date(employee.joining_date),
        "daysRemaining": _days_remaining(employee.joining_date),
        "alerts": _build_alerts(db, employee_id),

    }
 