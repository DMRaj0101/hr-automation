"""
Ticket Generation Agent -- PDD Section 4. Fully implemented (this part
has no ambiguity/integration decision to make -- it's our own native
system, not a third-party connector), unlike the four agents in
integrations/*_connector.py.

One ticket per Mock provisioning item (Section 4.3) -- never a parent
ticket with child tasks. Functional items never generate a ticket.
"""
import json
import datetime
import itertools
from sqlalchemy.orm import Session
from app.models import Ticket, AuditLog
from app.services.onboarding_status import mark_active_if_onboarding_complete

_ticket_counter = itertools.count(1001)  # TODO: replace with a real sequence/lookup once this isn't single-process -- fine for POC/demo scope


def _next_ticket_id(db: Session) -> str:
    """Simple incrementing ID (TKT-1001, TKT-1002, ...). Looks at the
    highest existing ticket_id in the DB first so restarts don't collide,
    rather than trusting the in-process counter alone."""
    last = db.query(Ticket).order_by(Ticket.ticket_id.desc()).first()
    if last and last.ticket_id.startswith("TKT-"):
        try:
            next_n = int(last.ticket_id.split("-")[1]) + 1
        except (IndexError, ValueError):
            next_n = next(_ticket_counter)
    else:
        next_n = next(_ticket_counter)
    return f"TKT-{next_n}"


def create_ticket(db: Session, employee_id: str, role: str, mock_item: dict, agent_name:str) -> Ticket:
    """mock_item is one entry from decision_agent.decide()'s "mock_items"
    list: {item, software_name, assigned_team, remarks}."""
    ticket_id = _next_ticket_id(db)
    ticket = Ticket(
        ticket_id=ticket_id,
        employee_id=employee_id,
        role=role,
        provisioning_item=mock_item["item"],
        software_name=mock_item.get("software_name"),
        assigned_team=mock_item["assigned_team"],
        status="Open",
        status_history=json.dumps([{
            "status": "Open", "changed_at": datetime.datetime.utcnow().isoformat(),
            "note": "Ticket created by Ticket Generation Agent.",
        }]),
        notes=mock_item.get("remarks"),
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    db.add(AuditLog(
        employee_id=employee_id,
        agent=agent_name,
        action=f"Created {ticket_id}",
        detail=f"{mock_item['item']} -> {mock_item['assigned_team']} team",
    ))
    db.commit()

    # TODO (Email Agent owner): fire PDD Section 6.2 I3 ("New ticket
    # created" -> notify assigned team) here, or from wherever this
    # function is called -- whichever ends up being the single place
    # per the "don't fire notifications from two places" lesson learned
    # in the previous version's reminders.py.

    return ticket


def update_status(db: Session, ticket: Ticket, new_status: str, note: str = None, closed_by: str = None) -> Ticket:
    """PDD Section 4.2 lifecycle: Open -> In Progress -> Pending -> Closed.
    No validation on legal transitions yet -- TODO: decide whether e.g.
    Closed -> Open should be allowed (reopening) before this goes to
    production use, currently anything is allowed."""
    history = json.loads(ticket.status_history) if ticket.status_history else []
    history.append({
        "status": new_status, "changed_at": datetime.datetime.utcnow().isoformat(), "note": note,
    })
    ticket.status = new_status
    ticket.status_history = json.dumps(history)
    ticket.status_changed_at = datetime.datetime.utcnow()
    if new_status == "Closed":
        ticket.closed_at = datetime.datetime.utcnow()
        ticket.closed_by = closed_by
    db.commit()
    db.refresh(ticket)
    agent_name = f"{ticket.provisioning_item} Agent"

    db.add(AuditLog(
        employee_id=ticket.employee_id,
        agent=agent_name,
        action=f"{ticket.ticket_id} -> {new_status}",
        detail=note or "",
    ))
    db.commit()

    # On a close, re-evaluate whether this employee's whole onboarding
    # is now done (all provisioning records completed + all tickets
    # closed) and, if so, flip them to "active". Idempotent and safe to
    # call from every close site (batch auto-close and organic human
    # close) -- see services/onboarding_status.py.
    if new_status == "Closed":
        mark_active_if_onboarding_complete(db, ticket.employee_id, agent_name)

    # TODO (Email Agent owner): fire the matching PDD Section 6.2
    # intimation depending on new_status (email wiring deferred):
    #   -> "Pending": I4 (assigned team, blocked, reason noted)
    #   -> "Closed": I5 ("Onboarding is complete") to HR + Manager, gated
    #      on the same completion signal used above
    #      (services/onboarding_status.is_onboarding_complete).

    return ticket
