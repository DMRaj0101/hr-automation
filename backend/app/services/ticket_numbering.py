"""
Single source of TKT- numbers for the whole system.

There are two ticket tables and they used to number themselves
independently:

  * ``Ticket`` (models/employee.py) -- the human-facing ticket the Ticket
    Generation Agent raises for every Mock item, numbered by
    ticket_agent._next_ticket_id(), which seeded an in-process counter at
    **1001**.
  * ``AgentTicket`` (models/agent_monitor_model.py) -- the AI execution-log
    ticket raised for *every* item, functional and mock, whose reference
    was formatted straight off its autoincrement primary key and so began
    at **0001**.

Both are rendered as "ticketID" on the same screens (the Tickets Page
lists AgentTicket rows, the Ticket Queue lists Ticket rows), so one
onboarding run produced TKT-0001..TKT-0004 for its functional items and
TKT-1001..TKT-1006 for its mock ones -- two interleaved sequences in what
looks like one queue. Every ticket-creating path now allocates from here
instead, so the numbers run in a single ascending order.

A Mock item still shares ONE number between its Ticket and its
AgentTicket: the orchestrator passes the Ticket's id to
report_started(ticket_reference=...) as an override, so the pair is two
views of the same ticket rather than two tickets.

Existing rows are left alone -- allocation continues above whatever the
database already holds, so a DB that already contains TKT-1006 carries on
at TKT-1007. Only a fresh database numbers cleanly from TKT-0001.
"""
import re

from sqlalchemy.orm import Session

from app.models import Ticket, AgentTicket

_PREFIX = "TKT-"
_PATTERN = re.compile(r"^TKT-(\d+)$")


def _highest(values) -> int:
    """Highest numeric suffix among the given ticket ids, 0 if none parse.
    Compared as integers, not as strings -- the previous
    order_by(ticket_id.desc()) was a lexicographic sort, which only
    happened to be right while every id was the same width."""
    best = 0
    for value in values:
        if not value:
            continue
        match = _PATTERN.match(value)
        if match:
            best = max(best, int(match.group(1)))
    return best


def next_ticket_reference(db: Session) -> str:
    """Next free TKT- number, scanning BOTH tables so the two can never
    hand out the same one.

    TODO: replace with a real DB sequence once this isn't single-process --
    two concurrent onboarding runs can still read the same maximum. Same
    caveat the in-process counter this replaced carried; fine for
    POC/demo scope.
    """
    highest = max(
        _highest(v for (v,) in db.query(Ticket.ticket_id).all()),
        _highest(v for (v,) in db.query(AgentTicket.ticket_reference).all()),
    )
    next_n = highest + 1
    return f"{_PREFIX}{next_n:04d}" if next_n <= 9999 else f"{_PREFIX}{next_n}"
