"""
Email Agent -- MailU connector. Owns the PDD provisioning item
"Email Account Creation" (all roles).

TODO (owner: whoever picks up the Email Agent):
1. Confirm the integration approach first -- MailU exposes an admin
   API (https://mailu.io, see their "Administration" API docs) but
   deployments vary; confirm with whoever owns the MailU instance
   whether it's reachable via API, or whether this needs to shell out
   to MailU's `flask mailu` CLI instead. This is genuinely open, unlike
   Keycloak/Kimai/Snipe-IT which all have straightforward REST APIs.
2. Get MailU admin credentials into env vars, same convention as
   keycloak_connector.py -- suggested: MAILU_URL, MAILU_ADMIN_TOKEN
   (or MAILU_ADMIN_USER/MAILU_ADMIN_PASSWORD, depending on (1)).
3. Implement create_mailbox() below.
4. IMPORTANT: this is a DIFFERENT system from app/email_client.py.
   email_client.py sends NOTIFICATION emails (welcome email, alerts,
   intimations -- PDD Section 6) via an existing SMTP/IMAP account.
   This module PROVISIONS a new mailbox for the employee in MailU --
   two unrelated jobs that happen to both be "email." Keep them
   separate; don't merge this into email_client.py.
5. Once a mailbox exists, PDD Section 6.2's I2 ("Mailbox successfully
   created" -> Welcome email w/ login instructions, temp password)
   fires -- that's already wired via WelcomeEmail model + email_client.py,
   just needs the temp password plumbed through from this connector's
   return value into the welcome email draft.
"""
import os

MAILU_URL = os.getenv("MAILU_URL", "")
MAILU_ADMIN_TOKEN = os.getenv("MAILU_ADMIN_TOKEN", "")


class MailUConnectorError(Exception):
    pass


def create_mailbox(employee_name: str, desired_local_part: str) -> dict:
    """
    TODO: implement. Should:
      - create the mailbox in MailU
      - generate a temporary password (or confirm MailU's own
        invite/reset-link flow is preferred instead)
      - return {"external_ref": "<mailu-mailbox-id-or-address>",
                 "email_address": "<generated-address>",
                 "temp_password": "<...>" (if applicable),
                 "detail": "<short human-readable summary>"}
      - raise MailUConnectorError on any failure

    Called from: app/orchestrators/onboarding_orchestrator.py.
    """
    raise NotImplementedError("TODO: implement MailU mailbox creation -- see module docstring")


def get_mailbox_status(external_ref: str) -> dict:
    """
    TODO: implement. Used by the Monitoring Agent's polling loop.
    Should return {"exists": bool} at minimum.
    """
    raise NotImplementedError("TODO: implement MailU mailbox status check -- see module docstring")
