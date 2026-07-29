"""
Asset Agent -- Snipe-IT connector. Owns the PDD provisioning items
"Asset Allocation" (all roles) and, for IT Support specifically,
"Asset Management (operational access)" -- IT Support gets real
operational console access to Snipe-IT itself, not just an allocation.

Snipe-IT has a well-documented REST API with token auth
(https://snipe-it.readme.io/reference/), so like Kimai this is a
mostly-mechanical connector -- no ambiguity about the integration
approach, just implementation work.

TODO (owner: whoever picks up the Asset Agent):
1. Get a Snipe-IT API token into env vars (SNIPEIT_URL, SNIPEIT_API_TOKEN).
2. Implement allocate_standard_kit() below -- the "standard professional
   hardware kit" per PDD Section 3 is: Laptop, Dual Monitor, Docking
   Station, Headset, Mobile Device. Confirm with whoever owns the
   Snipe-IT instance whether these are pre-seeded asset models to check
   out, or need to be created fresh each time.
3. For IT Support's "Asset Management (operational access)" item,
   this isn't an allocation -- it's granting the IT Support employee
   their OWN Snipe-IT login with real console access (per PDD's
   remark: "Snipe-IT is open source with no license cost -- operational
   console access is provisioned for real"). That's a second, distinct
   function from allocate_standard_kit() -- see grant_console_access()
   stub below, don't conflate the two.
4. Return {"external_ref": "<snipeit-asset-tag-or-checkout-id>", "detail": "..."},
   raise SnipeITConnectorError on failure.
"""
import os

SNIPEIT_URL = os.getenv("SNIPEIT_URL", "")
SNIPEIT_API_TOKEN = os.getenv("SNIPEIT_API_TOKEN", "")


class SnipeITConnectorError(Exception):
    pass


def allocate_standard_kit(employee_name: str, employee_email: str) -> dict:
    """
    TODO: implement -- check out Laptop, Dual Monitor, Docking Station,
    Headset, Mobile Device to this employee via Snipe-IT's checkout API.

    Called from: app/orchestrators/onboarding_orchestrator.py, for all
    roles' "Asset Allocation" item.
    """
    raise NotImplementedError("TODO: implement Snipe-IT standard kit allocation -- see module docstring")


def grant_console_access(employee_name: str, employee_email: str) -> dict:
    """
    TODO: implement -- create a real Snipe-IT user login (not an asset
    checkout) for IT Support employees only, per their
    "Asset Management (operational access)" provisioning item.

    Called from: app/orchestrators/onboarding_orchestrator.py, IT Support role only.
    """
    raise NotImplementedError("TODO: implement Snipe-IT console access grant -- see module docstring")


def get_asset_status(external_ref: str) -> dict:
    """TODO: implement. Used by the Monitoring Agent's polling loop."""
    raise NotImplementedError("TODO: implement Snipe-IT asset status check -- see module docstring")
