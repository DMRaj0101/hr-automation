"""
Mock connector -- the stand-in "downstream agent" for every provisioning
item marked `"status": "mock"` in config_data/provisioning_matrix.json.

Those items are the ones with no free/feasible API for this POC:
Microsoft 365, CCH Axcess Tax, CaseWare IDEA, Westlaw, ServiceNow,
Cisco AnyConnect VPN, and the not-yet-picked remote support tool. The
orchestrator already opens a human-facing Ticket for each of them (see
agents/ticket_agent.py) -- this module exists so the *provisioning* half
of a mock item also produces something, instead of leaving
ProvisioningRecord.external_ref/username and the credential store empty
while every Functional item fills all three.

NOTHING HERE IS REAL. No network call is made, no account exists
anywhere, and the returned password is not a working login -- it is
demo data so the Provisional Status screen can render a mock item in the
same shape as a real one. The `MOCK-` prefix on every external_ref is
deliberate: it makes a simulated identifier obvious in the DB, in the
audit log, and on screen, so nobody mistakes one for a real system's ID.

Return shape is the union of the real connectors' shapes
(keycloak_connector.create_user, mailu_connector.create_mailbox,
kimai_connector.create_user_and_timesheet,
openkm_connector.create_workspace), so the orchestrator's mock loop can
handle the result exactly the way its functional loop does.

Deliberately NOT calling services/action_counter.record_action(): that
counter tracks real API calls against real systems, and a simulated
provisioning is not one.

Called from: app/orchestrators/onboarding_orchestrator.py, once per
entry in decision_agent.decide()'s "mock_items" list.
"""
from __future__ import annotations

import re
import secrets
import string

from app.services import provisioning_details

_TEMP_PASSWORD_LENGTH = 16  # same length mailu_connector generates
_EXTERNAL_REF_SUFFIX_BYTES = 3  # -> 6 hex characters


def _generate_temp_password(length: int = _TEMP_PASSWORD_LENGTH) -> str:
    """Same generation the real connectors use -- `secrets`, not `random`.
    The value is throwaway demo data, but generating it weakly would make
    the mock rows look different from the real ones for no reason."""
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _slug(label: str) -> str:
    """"Microsoft 365, CCH Axcess Tax, NetDocuments" -> "MICROSOFT365".

    Several mock items list a whole license bundle in `software`, comma
    separated (see the "Access Recommendation" rows in
    provisioning_matrix.json) -- only the first entry is used, so the
    identifier stays short and readable.
    """
    first = label.split(",")[0]
    return re.sub(r"[^A-Za-z0-9]", "", first).upper()


def provision(
    mock_item: dict,
    *,
    employee_name: str,
    employee_email: str,
    employee_id: str,
    department: str,
) -> dict:
    """Simulate provisioning one Mock item for a newly onboarded employee.

    `mock_item` is one entry from decision_agent.decide()'s "mock_items"
    list: {item, software_name, assigned_team, remarks, agent_key}.
    Keyword-only for the employee fields -- there are four of them and
    they are all strings, so positional order would be easy to get wrong
    and impossible to notice.

    Returns {"external_ref": "MOCK-<SYSTEM>-<hex>", "username": "...",
    "temp_password": "...", "detail": "...", "provided": [...]} -- the
    real connectors' keys (so the caller needs no special-casing) plus
    `provided`, the list of things this item granted.

    `detail` and `provided` come from
    config_data/mock_provisioning_details.json via
    services/provisioning_details.py -- that file is where to change the
    wording or the contents of a mock item, not this module. Falls back
    to a generic sentence if an item has no template configured.

    Never raises and never touches the network; there is nothing here
    that can fail.
    """
    software_name = mock_item.get("software_name") or mock_item["item"]
    # Falls back to the item name when `software` is blank, so the ref is
    # never just "MOCK--a1b2c3".
    slug = _slug(software_name) or _slug(mock_item["item"]) or "SYSTEM"

    external_ref = f"MOCK-{slug}-{secrets.token_hex(_EXTERNAL_REF_SUFFIX_BYTES).upper()}"
    # Same derivation the orchestrator already uses for MailU's local
    # part, so a mock account's username matches the real ones.
    username = employee_email.split("@")[0]

    agent_key = mock_item.get("agent_key") or ""
    item = mock_item["item"]
    placeholders = {
        "employee_name": employee_name,
        "employee_id": employee_id,
        "software_name": software_name,
        "external_ref": external_ref,
        "username": username,
    }

    detail = provisioning_details.render_detail(agent_key, item, department, **placeholders)
    if not detail:
        detail = (
            f"{software_name} access simulated for {employee_name} "
            f"-- mock item, no real provisioning call was made."
        )

    return {
        "external_ref": external_ref,
        "username": username,
        "temp_password": _generate_temp_password(),
        "detail": detail,
        "provided": provisioning_details.provided_for(agent_key, item, department, **placeholders),
    }
