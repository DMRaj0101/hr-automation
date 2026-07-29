"""
Time & Billing Agent -- Kimai connector. Owns the PDD provisioning item
"Time & Billing" (Tax, Audit, Law roles -- not IT Support).

Kimai has a documented, straightforward REST API
(https://www.kimai.org/documentation/rest-api.html) with API-token auth,
so this is one of the more mechanical connectors to implement -- closest
in shape to the existing app/integrations/hrms_connector.py's plain
`requests` calls.

TODO (owner: whoever picks up the Time & Billing Agent):
1. Get a Kimai API token into an env var (KIMAI_URL, KIMAI_API_TOKEN),
   same convention as the other connectors.
2. Implement create_user_and_timesheet() below:
   - POST to Kimai's /api/users endpoint to create the user
   - Kimai's "timesheet profile" is really just the user's default
     hourly rate + team/customer assignment -- check with whoever owns
     the Kimai instance what defaults to use per role (the PDD's
     Section 13 reference sample gives one example: hourly rate $45,
     cost center TAX-OPS-01, billable=yes, projects
     TAX-CLIENT-4471/TAX-INTERNAL-01 -- but that's Tax-specific sample
     data, not a rule to hardcode for every role).
3. Return {"external_ref": "<kimai-username-or-user-id>", "detail": "..."},
   raise KimaiConnectorError on failure.
"""
import os

KIMAI_URL = os.getenv("KIMAI_URL", "")
KIMAI_API_TOKEN = os.getenv("KIMAI_API_TOKEN", "")


class KimaiConnectorError(Exception):
    pass


def create_user_and_timesheet(employee_name: str, employee_email: str, role: str) -> dict:
    """
    TODO: implement. See module docstring for what's needed.

    Called from: app/orchestrators/onboarding_orchestrator.py, only for
    roles where provisioning_matrix.json marks "Time & Billing" as
    functional (currently: Tax, Audit, Law).
    """
    raise NotImplementedError("TODO: implement Kimai user + timesheet setup -- see module docstring")


def get_user_status(external_ref: str) -> dict:
    """TODO: implement. Used by the Monitoring Agent's polling loop."""
    raise NotImplementedError("TODO: implement Kimai user status check -- see module docstring")
