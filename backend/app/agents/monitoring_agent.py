"""
Monitoring Agent -- PDD Section 5. Polling-based (not event-driven): checks
each in-progress ProvisioningRecord on a schedule rather than waiting for
agents to push status.

identity (Keycloak), email (MailU), and document_management (OpenKM) are
wired to real status-check functions. time_billing (Kimai) and asset
(Snipe-IT) are still None -- poll_once() skips those cleanly until
those two connectors exist.

Retry backoff, failure-ticket creation, and SLA breach detection are
now implemented (previously all three were TODO stubs) -- see
RETRY_BACKOFF_SECONDS, _create_failure_ticket(), and
_check_sla_breaches() below. Wired into main.py's startup event as of
this pass -- see main.py's on_startup().
"""
import os
import json
import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import ProvisioningRecord, Ticket, AuditLog, Employee
from app.agents import ticket_agent
from app.integrations import openkm_connector, keycloak_connector, mailu_connector
from app import email_client

POLL_INTERVAL_SECONDS = int(os.getenv("MONITORING_POLL_INTERVAL_SECONDS", "30"))
MAX_RETRIES = 3
SLA_PENDING_HOURS = 4
MANAGER_TEAM_EMAIL = os.getenv("MANAGER_TEAM_EMAIL", "")

# PDD Section 5: "3 attempts, with backoff (immediate -> 30s -> 2min)".
# Indexed by retry_count *before* the attempt about to be made:
#   retry_count == 0 (never tried, or first failure not yet retried) -> 0s wait (immediate)
#   retry_count == 1 (one failure so far)                            -> 30s wait
#   retry_count == 2 (two failures so far)                           -> 120s wait
# retry_count >= 3 (MAX_RETRIES) is handled separately -- that's the
# "give up, create a ticket" case, not a further backoff wait.
RETRY_BACKOFF_SECONDS = [0, 30, 120]

# TODO: wire the remaining two to integrations/<system>_connector.py's
# get_*_status(external_ref) function once Kimai/Snipe-IT are
# implemented. Left as None so poll_once() below can skip cleanly (and
# log a clear "not implemented yet" note) rather than crashing the
# whole poll loop over one missing piece.
STATUS_CHECKERS = {
    "identity": keycloak_connector.get_user_status,  # implemented
    "email": mailu_connector.get_mailbox_status,      # implemented
    "time_billing": None,  # TODO: app.integrations.kimai_connector.get_user_status
    "asset": None,         # TODO: app.integrations.snipeit_connector.get_asset_status
    "document_management": openkm_connector.get_workspace_status,  # implemented
}


def _create_failure_ticket(db: Session, record: ProvisioningRecord):
    """PDD Section 5: "After max retries: Agent marks item Failed;
    Monitoring Agent auto-creates an IT ticket." This is the native,
    human-facing Ticket (Section 4), the same one Mock items use --
    NOT the separate agent_ticketing/AgentTicket execution-log system
    (that one's populated live from inside the orchestrator's
    provisioning loop, not from here -- see
    orchestrators/onboarding_orchestrator.py).

    A functional item that exhausted its retries doesn't have a
    pre-built mock_item dict (those only exist for items the Decision
    Agent already classified as Mock) -- so one is constructed here
    from the ProvisioningRecord + a lookup of the employee's role,
    matching ticket_agent.create_ticket()'s expected shape."""
    employee = db.query(Employee).filter(Employee.id == record.employee_id).first()
    if not employee:
        # Shouldn't happen (ProvisioningRecord always comes from a real
        # employee), but don't let a dangling FK crash the whole poll cycle.
        db.add(AuditLog(
            employee_id=record.employee_id, agent="Monitoring Agent",
            action=f"Could not create failure ticket for {record.provisioning_item}",
            detail="Employee record not found",
        ))
        db.commit()
        return

    mock_item = {
        "item": record.provisioning_item,
        "software_name": record.software_name,
        "assigned_team": "IT",  # PDD Section 5's own wording: "auto-creates an IT ticket"
        "remarks": f"Auto-created by Monitoring Agent after {MAX_RETRIES} failed attempts. Last error: {record.error_detail}",
    }
    ticket_agent.create_ticket(db, record.employee_id, employee.role, mock_item)


def _check_sla_breaches(db: Session):
    """PDD Section 5 / Section 6.1's A2: "Ticket in Pending > 4 hours
    triggers an escalation flag." One-shot per ticket (via
    sla_flagged_at) so the same breach doesn't re-alert every poll
    cycle. Per Section 6.1's ownership table, A2 goes to Team
    Lead/Manager -- sent via the existing real SMTP setup
    (email_client.py), same infrastructure the welcome email uses."""
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(hours=SLA_PENDING_HOURS)
    breaching = db.query(Ticket).filter(
        Ticket.status == "Pending",
        Ticket.status_changed_at < cutoff,
        Ticket.sla_flagged_at.is_(None),
    ).all()

    for ticket in breaching:
        ticket.sla_flagged_at = datetime.datetime.utcnow()
        db.commit()
        db.add(AuditLog(
            employee_id=ticket.employee_id, agent="Monitoring Agent",
            action=f"SLA breach flagged for {ticket.ticket_id}",
            detail=f"Pending since {ticket.status_changed_at}, exceeds {SLA_PENDING_HOURS}h threshold",
        ))
        db.commit()

        if MANAGER_TEAM_EMAIL:
            try:
                email_client.send_email(
                    to_address=MANAGER_TEAM_EMAIL,
                    subject=f"[SLA Alert] {ticket.ticket_id} has been Pending over {SLA_PENDING_HOURS} hours",
                    body=(
                        f"Ticket {ticket.ticket_id} ({ticket.provisioning_item}, assigned to "
                        f"{ticket.assigned_team}) has been in Pending status since "
                        f"{ticket.status_changed_at} -- longer than the {SLA_PENDING_HOURS}-hour "
                        f"SLA threshold.\n\nNotes: {ticket.notes or 'none'}"
                    ),
                )
            except Exception as e:
                # Don't let an email delivery failure stop other breach
                # checks in this batch, or crash the poll cycle -- the
                # flag + audit log above are already the source of truth;
                # email is a best-effort notification on top of that.
                db.add(AuditLog(
                    employee_id=ticket.employee_id, agent="Monitoring Agent",
                    action=f"SLA alert email failed for {ticket.ticket_id}", detail=str(e),
                ))
                db.commit()
        else:
            db.add(AuditLog(
                employee_id=ticket.employee_id, agent="Monitoring Agent",
                action=f"SLA alert email skipped for {ticket.ticket_id}",
                detail="MANAGER_TEAM_EMAIL not configured",
            ))
            db.commit()


def _due_for_retry(record: ProvisioningRecord) -> bool:
    """Backoff gate -- returns False if this record was attempted too
    recently to retry yet, per RETRY_BACKOFF_SECONDS. A record that's
    never been attempted (last_attempted_at is None) is always due."""
    if record.last_attempted_at is None:
        return True
    wait_index = min(record.retry_count, len(RETRY_BACKOFF_SECONDS) - 1)
    required_wait = datetime.timedelta(seconds=RETRY_BACKOFF_SECONDS[wait_index])
    return datetime.datetime.utcnow() - record.last_attempted_at >= required_wait


def poll_once(db: Session):
    """One pass over every in-progress ProvisioningRecord, plus one
    SLA-breach sweep over the Ticket table. Called on a loop by
    monitoring_loop() (wired into main.py's startup event)."""
    in_progress = db.query(ProvisioningRecord).filter(
        ProvisioningRecord.status.in_(["not_started", "in_progress"])
    ).all()

    for record in in_progress:
        checker = STATUS_CHECKERS.get(record.agent_key)
        if checker is None:
            continue  # connector not implemented yet (Kimai/Snipe-IT)
        if not record.external_ref:
            continue  # nothing to check yet -- e.g. orchestrator's NotImplementedError path left this unset
        if not _due_for_retry(record):
            continue  # backoff window hasn't elapsed yet

        try:
            result = checker(record.external_ref)
            # All get_*_status functions are documented to return a dict
            # with at least an "exists" key (see each connector's
            # docstring) -- interpreted generically here so this works
            # for every connector without a per-system branch.
            if result.get("exists"):
                if record.status != "completed":
                    record.status = "completed"
                    record.completed_at = datetime.datetime.utcnow()
                    db.commit()
            else:
                # System reports the record no longer exists (e.g. folder
                # was deleted out-of-band) -- treat like a failure so it
                # goes through the same retry/ticket path below.
                raise RuntimeError(f"{record.provisioning_item} no longer exists in the target system")
        except Exception as e:
            record.retry_count += 1
            record.last_attempted_at = datetime.datetime.utcnow()
            record.error_detail = str(e)
            if record.retry_count >= MAX_RETRIES:
                record.status = "failed"
                db.commit()
                try:
                    _create_failure_ticket(db, record)
                except Exception as ticket_err:
                    # Don't let a ticket-creation problem abort the rest
                    # of this poll cycle (remaining records + the SLA
                    # sweep below) -- log it and move on, same
                    # non-fatal spirit as the SLA email try/except above.
                    db.add(AuditLog(
                        employee_id=record.employee_id, agent="Monitoring Agent",
                        action=f"Failed to auto-create ticket for {record.provisioning_item}",
                        detail=str(ticket_err),
                    ))
                    db.commit()
            else:
                db.commit()
            db.add(AuditLog(
                employee_id=record.employee_id, agent="Monitoring Agent",
                action=f"Poll failed for {record.provisioning_item}",
                detail=f"Attempt {record.retry_count}/{MAX_RETRIES}: {e}",
            ))
            db.commit()

    _check_sla_breaches(db)


async def monitoring_loop():
    """Called from main.py's on_startup() via
    asyncio.create_task(monitoring_loop())."""
    import asyncio
    while True:
        await asyncio.sleep(POLL_INTERVAL_SECONDS)
        db = SessionLocal()
        try:
            poll_once(db)
        except Exception as e:
            print(f"[MONITORING AGENT] Error: {e}")
        finally:
            db.close()
