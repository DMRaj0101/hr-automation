"""
Monitoring Agent -- PDD Section 5. Polling-based (not event-driven): checks
each in-progress ProvisioningRecord on a schedule rather than waiting for
agents to push status.

The loop structure below is fully wired (it's the same shape as the
previous version's main.py background loops -- _poll_inboxes_loop /
_reminder_escalation_loop), but the actual "go check the real system"
calls are TODO, since they depend on each integrations/*_connector.py
being implemented first (get_user_status / get_mailbox_status / etc.).

TODO (owner: whoever picks up the Monitoring Agent -- likely last,
since it depends on the four connectors existing first):
1. Wire STATUS_CHECKERS below to each connector's get_*_status function
   once implemented.
2. Implement the retry-with-backoff timing precisely per PDD Section 5:
   "3 attempts, with backoff (immediate -> 30s -> 2min)" -- the skeleton
   below just counts retries, it does not yet enforce the backoff
   intervals between attempts.
3. Implement _create_failure_ticket() -- PDD Section 5: "After max
   retries: Agent marks item Failed; Monitoring Agent auto-creates an
   IT ticket." This should call agents/ticket_agent.py's create_ticket()
   with assigned_team="IT", same as any other mock item's ticket.
4. Implement SLA breach detection for open Tickets: "Ticket in Pending
   > 4 hours triggers an escalation flag" (this polls the Ticket table,
   not a connector -- see PDD Section 5's "Poll targets" row, which
   explicitly includes "native Ticket table" alongside the four real
   systems).
5. Wire this loop into backend/main.py the same way the previous
   version's two background loops were wired in `on_startup()` --
   this file intentionally does NOT register itself; main.py owns
   that (see main.py's TODO comment).
"""
import os
import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import ProvisioningRecord, Ticket, AuditLog
from app.agents import ticket_agent

POLL_INTERVAL_SECONDS = int(os.getenv("MONITORING_POLL_INTERVAL_SECONDS", "30"))
MAX_RETRIES = 3
SLA_PENDING_HOURS = 4

# TODO: wire each of these to integrations/<system>_connector.py's
# get_*_status(external_ref) function once implemented. Left as None so
# poll_once() below can skip cleanly (and log a clear "not implemented
# yet" note) for whichever connectors aren't done yet, rather than
# crashing the whole poll loop over one missing piece.
STATUS_CHECKERS = {
    "identity": None,      # TODO: app.integrations.keycloak_connector.get_user_status
    "email": None,         # TODO: app.integrations.mailu_connector.get_mailbox_status
    "time_billing": None,  # TODO: app.integrations.kimai_connector.get_user_status
    "asset": None,         # TODO: app.integrations.snipeit_connector.get_asset_status
    "document_management": None,  # TODO: app.integrations.openkm_connector.get_workspace_status
}


def _create_failure_ticket(db: Session, record: ProvisioningRecord):
    """TODO: implement -- see module docstring point 3."""
    raise NotImplementedError("TODO: auto-create an IT ticket for a provisioning record that exhausted retries")


def _check_sla_breaches(db: Session):
    """TODO: implement -- see module docstring point 4."""
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(hours=SLA_PENDING_HOURS)
    # TODO: query Ticket where status == "Pending" and status_changed_at < cutoff,
    # and hasn't already been flagged (consider adding an `sla_flagged_at`
    # column to the Ticket model, same one-shot pattern the previous
    # version used for OnboardingTask.escalated_at), then fire PDD
    # Section 6.1's A2 alert to Team Lead/Manager.
    pass


def poll_once(db: Session):
    """One pass over every in-progress ProvisioningRecord. Called on a
    loop by whatever wires this into main.py (see module docstring
    point 5)."""
    in_progress = db.query(ProvisioningRecord).filter(
        ProvisioningRecord.status.in_(["not_started", "in_progress"])
    ).all()

    for record in in_progress:
        checker = STATUS_CHECKERS.get(record.agent_key)
        if checker is None:
            continue  # TODO: remove this skip once the matching connector is implemented

        try:
            result = checker(record.external_ref)
            # TODO: interpret `result` per-system (shape varies by connector,
            # see each connector's get_*_status docstring) and update
            # record.status accordingly -- "completed" if confirmed done,
            # leave as "in_progress" if still pending, "failed" if the
            # system reports an error.
        except Exception as e:
            record.retry_count += 1
            record.last_attempted_at = datetime.datetime.utcnow()
            record.error_detail = str(e)
            if record.retry_count >= MAX_RETRIES:
                record.status = "failed"
                _create_failure_ticket(db, record)
            db.commit()
            db.add(AuditLog(
                employee_id=record.employee_id, agent="Monitoring Agent",
                action=f"Poll failed for {record.provisioning_item}",
                detail=f"Attempt {record.retry_count}/{MAX_RETRIES}: {e}",
            ))
            db.commit()

    _check_sla_breaches(db)


async def monitoring_loop():
    """TODO: call this from main.py's on_startup() via
    asyncio.create_task(monitoring_loop()), same pattern as the
    previous version's _poll_inboxes_loop / _reminder_escalation_loop.
    Not self-registering, so main.py stays the single place that wires
    up background tasks (easier to see everything running at a glance)."""
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
