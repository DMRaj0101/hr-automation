"""
Live onboarding-completion rollup -- the "is this employee fully
onboarded yet?" question, computed fresh from the DB every time (never
cached).

An employee's onboarding is complete when EVERY provisioning item has
reached a terminal-success state:
  - all ProvisioningRecords are "completed" (functional items, plus the
    mirror records the orchestrator creates for mock items), and
  - all Tickets are "Closed" (mock items + any Monitoring-Agent failure
    tickets).

When that becomes true, mark_active_if_onboarding_complete() flips
Employee.status "provisioning" -> "active" (the last leg of the
registered -> provisioning -> active lifecycle on the Employee model).

NOTE: PDD Section 6.2's I5 ("Onboarding is complete" -> HR + Manager)
notification is intentionally NOT sent here yet -- email wiring is
deferred. The status flip below is the completion signal that the I5
email would hang off once that's built.
"""
from sqlalchemy.orm import Session
from app.models import Employee, ProvisioningRecord, Ticket, OnboardingTracker, AuditLog

# Kept in sync with onboarding_orchestrator.STEP_TICKETING by hand -- a
# string literal rather than an import, to avoid a cycle (orchestrator
# imports ticket_agent, which imports this module).
_STEP_TICKETING = "Ticketing"


def is_onboarding_complete(db: Session, employee_id: str) -> bool:
    """True only once EVERY provisioning record is completed and every
    ticket is closed for this employee.

    Guards against a premature "complete" during the orchestrator's
    incremental mock-ticket loop: while that loop runs, only a partial
    set of records/tickets exists, so a naive all()-over-existing-rows
    would report complete after the first item. We therefore require the
    Ticketing step itself to be marked completed first -- i.e. the
    orchestrator has finished creating every ticket/record for this
    employee. Organic (post-onboarding) ticket closes always satisfy
    this, so they evaluate correctly."""
    ticketing_done = db.query(OnboardingTracker).filter(
        OnboardingTracker.employee_id == employee_id,
        OnboardingTracker.step == _STEP_TICKETING,
        OnboardingTracker.status == "completed",
    ).first()
    if not ticketing_done:
        return False

    records = db.query(ProvisioningRecord).filter(
        ProvisioningRecord.employee_id == employee_id
    ).all()
    tickets = db.query(Ticket).filter(Ticket.employee_id == employee_id).all()

    if not records and not tickets:
        return False  # nothing was ever provisioned -- not "complete"

    all_records_done = all(r.status == "completed" for r in records)
    all_tickets_done = all(t.status == "Closed" for t in tickets)
    return all_records_done and all_tickets_done


def mark_active_if_onboarding_complete(db: Session, employee_id: str, agent_name: str) -> bool:
    """If (and only if) this employee's onboarding just became complete,
    flip Employee.status to "active". Idempotent -- the "active" flip is
    itself the one-shot guard, so calling this from every ticket-close
    site marks the employee active exactly once. Returns True iff the
    status was flipped on this call."""
    if not is_onboarding_complete(db, employee_id):
        return False

    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee or employee.status == "active":
        return False  # already marked complete

    employee.status = "active"
    db.commit()

    db.add(AuditLog(
        employee_id=employee_id, agent=agent_name,
        action="Onboarding complete", detail="All provisioning items completed and all tickets closed.",
    ))
    db.commit()
    return True
