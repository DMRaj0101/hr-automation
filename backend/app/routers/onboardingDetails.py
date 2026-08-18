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
from app.services import credential_store, provisioning_details

router = APIRouter(prefix="/onboarding-details", tags=["onboarding-details"])
 
# Employee.status ("registered" | "provisioning" | "active") -> the

# onboarding-status vocabulary the frontend already styles in

# lib/utils.ts's statusColorMap (Onboarding / In Progress / Completed).

_STATUS_LABELS = {

    "registered": "Onboarding",

    "provisioning": "In Progress",

    "active": "Completed",

}

EXCLUDED_AGENT_KEYS = ["KeyCloak", "keycloak"]  

 
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
 
 
# AgentTicket.agent_name (display name, e.g. "Time & Billing Agent") ->
# ProvisioningRecord.agent_key (e.g. "time_billing"). Reuses
# onboarding_orchestrator.AGENT_DISPLAY_NAMES (the source of truth for
# agent_key -> display name) instead of re-deriving it -- comparing the
# display name directly against agent_key (as this file previously did)
# never matches anything, since "Identity Agent" != "identity".
_AGENT_DISPLAY_TO_KEY = {display: key for key, display in AGENT_DISPLAY_NAMES.items()}


def _format_dt(value):

    return value.strftime("%d-%m-%Y %H:%M:%S") if value else None


def _hide_credentials_for_record(record) -> bool:
    """Keycloak/identity rows intentionally hide credentials in the UI.
    Some records are keyed by agent_key ('identity' / 'keycloak'), while
    failed rows may also surface as platform='Keycloak'; match both shapes,
    case-insensitive, so every Keycloak result suppresses username/password.
    """
    if record is None:
        return False

    agent_key = (record.agent_key or "").strip().lower()
    software_name = (record.software_name or "").strip().lower()
    return agent_key in {"identity", "keycloak"} or software_name == "keycloak"


def _provisional_row(agent, record, creds_by_record: dict, employee: Employee) -> dict:
    """One "Provisioning Result" row for the individual employee's
    onboarding tracker (frontend: components/onboarding/OnboardingChecklist
    .tsx, route /onboarding/[id]).

    externalRef is the identifier the provisioned system handed back --
    the Keycloak user UUID, the OpenKM folder UUID, the Kimai user id, or
    the MailU mailbox address. It stays null until the item completes,
    since ProvisioningRecord.external_ref is only written on success.

    note is the agent's own account of what it did, naming the employee and
    the identifier it created (Functional items) or what was granted (Mock
    items) -- written to AgentTicket.content by the orchestrator from each
    connector's `detail`. See services/agent_ticketing_service/
    ticket_service.py::handle_agent_completed.

    provided is the list of things this item granted ("Laptop", "Dual
    Monitor", ...), resolved from config_data/mock_provisioning_details.json
    at read time rather than persisted -- see
    services/provisioning_details.py's module docstring for why, and for the
    consequence (editing that file changes what past rows report).

    Credentials are read from the ProvisionedCredential store rather than
    off ProvisioningRecord, so username and password are guaranteed to be
    the pair actually issued together instead of two fields from two
    sources. record.username is kept only as a fallback for rows
    provisioned before the credential store existed. POC-only plaintext --
    see services/credential_store.py.
    """
    base = {
        "ticketID": agent.ticket_reference if agent else None,  # real
        "ticketStatus": agent.status,
        "startTime": _format_dt(agent.start_time),
        "endtime": _format_dt(agent.end_time),
        "note": agent.content,
    }

    # Mock-item agents have no ProvisioningRecord and never had real
    # credentials -- same "Mock" placeholders this endpoint always used.
    if record is None:
        return {
            **base,
            "platform": agent.agent_name,
            "externalRef": None,
            "credentials": {"username": "Mock", "password": "Mock"},
            "provided": [],
        }

    credential = creds_by_record.get(record.id)
    external_ref = (credential.external_ref if credential else None) or record.external_ref
    username = (credential.username if credential else None) or record.username
    hide_credentials = _hide_credentials_for_record(record)

    return {
        **base,
        "platform": record.software_name,  # real
        "externalRef": external_ref,
        "credentials": {
            "username": None if hide_credentials else username,
            # None when the connector reused an existing account and issued
            # nothing new; the frontend hides the password row in that case.
            "password": credential.password if credential and not hide_credentials else None,
        },
        "provided": provisioning_details.provided_for(
            record.agent_key, record.provisioning_item, employee.department,
            employee_name=employee.name,
            employee_id=employee.employee_id,
            software_name=record.software_name or "",
            external_ref=external_ref or "",
            username=username or "",
        ),
    }


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

    straight off the matching AgentTicket. note is no longer placeholder

    text -- it is the agent's own report of what it provisioned, naming the

    employee and the identifier created (see _provisional_row()).

    provided lists what the item granted, resolved from

    config_data/mock_provisioning_details.json at read time.

    externalRef is the identifier the provisioned system returned on

    success (Keycloak user UUID, OpenKM folder UUID, Kimai user id, MailU

    mailbox address), null while an item is still in progress.

    credentials.username/password both come from the ProvisionedCredential

    store, so they are the pair actually issued together (POC only --

    stored in plaintext, see services/credential_store.py). password used

    to read ProvisioningRecord.external_ref, which only ever held a real

    password for MailU and by accident -- for every other agent it showed

    a Keycloak UUID / Kimai id / OpenKM folder uuid labelled as a password.

    See _provisional_row() for the per-row shape."""

    employees = (

        db.query(Employee)

        .filter(Employee.employee_id == employee_id)

        .all()

    )
 
    result = {}

    for employee in employees:
        result[employee.employee_id] = []

        # Credentials for every provisioned app, fetched once per employee
        # and indexed by provisioning record so the row build below stays a
        # dict lookup rather than a query per agent.
        creds_by_record = {
            c.provisioning_record_id: c
            for c in credential_store.get_credentials_for_employee(db, employee.id)
            if c.provisioning_record_id
        }

        agent_details = (
            db.query(AgentTicket)
            .filter(AgentTicket.employee_id == employee.employee_id)
            .order_by(AgentTicket.ticket_id)
            .all()
        )

        # An AgentTicket carries no reference to the ProvisioningRecord it
        # ran for -- only an agent_name, which maps to an agent_key. Two
        # roles have TWO items sharing one agent_key (IT Support's two
        # "identity" items and its two "asset" items), so matching on
        # agent_key alone produced a cross-product: 2 tickets x 2 records =
        # 4 rows, each pairing one item's ticket with the other item's
        # record. That showed a row whose `note` described the hardware kit
        # while its externalRef and provided[] belonged to the console-access
        # item -- confidently wrong, not just duplicated.
        #
        # Paired positionally instead: within one agent_key, the Nth agent
        # ticket belongs to the Nth provisioning record, because the
        # orchestrator creates them in lockstep (record first, then
        # report_started) in a single pass over the plan. AgentTicket.ticket_id
        # is autoincrement so its order is exact; ProvisioningRecord has no
        # monotonic column, so it leans on created_at -- safe here because a
        # connector call and a ticket write separate any two records sharing
        # a key. A record with no ticket emits no row, same as before.
        pending_records: dict[str, list] = {}
        for rec in (
            db.query(ProvisioningRecord)
            .filter(ProvisioningRecord.employee_id == employee.id)
            .order_by(ProvisioningRecord.created_at)
            .all()
        ):
            pending_records.setdefault(rec.agent_key, []).append(rec)

        for agent in agent_details:
            agent_key = _AGENT_DISPLAY_TO_KEY.get(agent.agent_name)
            queue = pending_records.get(agent_key) if agent_key else None
            # None for an agent whose name doesn't map to an agent_key, or
            # whose records are already all paired -- falls back to the
            # "Mock" placeholder row in _provisional_row().
            record = queue.pop(0) if queue else None

            result[employee.employee_id].append(
                _provisional_row(agent, record, creds_by_record, employee)
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
 