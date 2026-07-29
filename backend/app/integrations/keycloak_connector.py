"""
Identity Agent -- Keycloak connector. Owns PDD provisioning items:
"Identity Account Creation" (all roles) and "Helpdesk Admin Role
(scoped)" (IT Support role only).

TODO (owner: whoever picks up the Identity Agent):
1. Get Keycloak admin credentials (client_id/client_secret or
   admin username/password) into env vars -- follow the same
   "env vars only, never hardcoded" convention as email_client.py's
   SMTP_* vars. Suggested vars: KEYCLOAK_URL, KEYCLOAK_REALM,
   KEYCLOAK_ADMIN_CLIENT_ID, KEYCLOAK_ADMIN_CLIENT_SECRET.
2. Implement create_user() below using either the `python-keycloak`
   package or raw `requests` against the Admin REST API
   (POST /admin/realms/{realm}/users).
3. Assign the default role per PDD Section 3 ("assign default role")
   -- for IT Support's "Helpdesk Admin Role (scoped)" item, this is a
   DIFFERENT, more limited role than the default -- see
   provisioning_matrix.json's remarks for that entry. Don't conflate
   the two; they're two separate ProvisioningRecord rows even though
   both go through this same connector.
4. Return a dict the orchestrator can store on ProvisioningRecord.
   external_ref should be the Keycloak user ID (UUID) so the
   Monitoring Agent can look the user up directly on each poll
   rather than trusting only our own DB state.
5. Raise (don't swallow) on failure -- the orchestrator's retry logic
   (see agents/monitoring_agent.py) depends on exceptions propagating
   so it can count attempts and back off, same pattern as
   ai_client.py's OllamaError being caught by callers rather than
   ai_client.py itself deciding what to do about failures.
"""
import os

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "")
KEYCLOAK_ADMIN_CLIENT_ID = os.getenv("KEYCLOAK_ADMIN_CLIENT_ID", "")
KEYCLOAK_ADMIN_CLIENT_SECRET = os.getenv("KEYCLOAK_ADMIN_CLIENT_SECRET", "")


class KeycloakConnectorError(Exception):
    pass


def create_user(employee_name: str, employee_email: str, role: str, scoped_role: bool = False) -> dict:
    """
    TODO: implement. Should:
      - create the Keycloak user (username/email = employee_email)
      - assign the appropriate realm/client role
        (default role, or the scoped Helpdesk Admin role if scoped_role=True)
      - return {"external_ref": "<keycloak-user-uuid>", "detail": "<short human-readable summary>"}
      - raise KeycloakConnectorError on any failure (auth, network, duplicate user, etc.)

    Called from: app/orchestrators/onboarding_orchestrator.py, for both the
    "Identity Account Creation" item (scoped_role=False) and, for IT Support
    only, the "Helpdesk Admin Role (scoped)" item (scoped_role=True).
    """
    raise NotImplementedError("TODO: implement Keycloak user creation -- see module docstring")


def get_user_status(external_ref: str) -> dict:
    """
    TODO: implement. Used by the Monitoring Agent (agents/monitoring_agent.py)
    to verify a previously-created user still exists / is enabled, as part
    of its polling loop (PDD Section 5: "Poll targets: Keycloak, MailU,
    Kimai, Snipe-IT, native Ticket table").

    Should return {"exists": bool, "enabled": bool} at minimum.
    """
    raise NotImplementedError("TODO: implement Keycloak user status check -- see module docstring")
