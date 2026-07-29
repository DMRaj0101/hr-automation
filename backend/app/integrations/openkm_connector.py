"""
Document Management Agent -- OpenKM connector. Owns the PDD provisioning
items "Client Document Repository" (Tax), "Client Engagement Repository"
(Audit), and "Document Management" (Law).

NOTE -- scope note, not just plumbing: in the original PDD Section 3
tables these three items were all marked Mock (they were spec'd against
commercial platforms -- NetDocuments for Tax/Audit, iManage Work for
Law -- which aren't feasible to stand up for free in this POC). OpenKM
is open-source with a real REST/SOAP API, so these were upgraded to
Functional. See config_data/provisioning_matrix.json's `_comment` and
MIGRATION_NOTES.md for the same note. IT Support does not get a
document-management item at all (per the PDD's Section 3.4 table), so
this connector is only ever called for Tax/Audit/Law.

OpenKM's API docs: https://docs.openkm.com/kcenter/view/openkm/ --
it exposes both a SOAP API and a newer REST API depending on version;
confirm which is available on whatever instance you stand up before
picking one.

TODO (owner: whoever picks up the Document Management Agent):
1. Get OpenKM admin credentials into env vars -- suggested:
   OPENKM_URL, OPENKM_USER, OPENKM_PASSWORD (OpenKM's REST API uses
   HTTP Basic auth by default; confirm this against your instance's
   version rather than assuming).
2. Implement create_workspace() below -- per-employee (or per-client
   engagement, for Audit) folder/workspace creation is the core action;
   confirm with whoever owns the OpenKM instance what folder structure
   convention to use (e.g. /okm:root/Tax/{employee_id}/ vs a flat
   per-client structure) before hardcoding one.
3. Decide whether this also needs to grant the employee read/write
   permissions on their own workspace (likely yes) as a second call,
   or whether that's bundled into folder creation by OpenKM's API.
4. Return {"external_ref": "<openkm-folder-uuid-or-path>", "detail": "..."},
   raise OpenKMConnectorError on failure.
5. Once implemented, wire it into two places (nothing else needs to change):
   - orchestrators/onboarding_orchestrator.py's _PROVISIONING_CALLS dict:
     add "document_management": lambda emp: openkm_connector.create_workspace(emp.name, emp.email, emp.role)
   - agents/monitoring_agent.py's STATUS_CHECKERS dict:
     change "document_management": None to point at get_workspace_status below.
"""
import os

OPENKM_URL = os.getenv("OPENKM_URL", "")
OPENKM_USER = os.getenv("OPENKM_USER", "")
OPENKM_PASSWORD = os.getenv("OPENKM_PASSWORD", "")


class OpenKMConnectorError(Exception):
    pass


def create_workspace(employee_name: str, employee_email: str, role: str) -> dict:
    """
    TODO: implement. Should:
      - create a folder/workspace for this employee (or their client
        engagement, depending on the folder-structure decision in
        point 2 above)
      - grant the employee access to it
      - return {"external_ref": "<openkm-folder-uuid-or-path>", "detail": "<short human-readable summary>"}
      - raise OpenKMConnectorError on any failure

    Called from: app/orchestrators/onboarding_orchestrator.py, for
    Tax/Audit/Law roles only -- IT Support has no document-management
    provisioning item.
    """
    raise NotImplementedError("TODO: implement OpenKM workspace creation -- see module docstring")


def get_workspace_status(external_ref: str) -> dict:
    """
    TODO: implement. Used by the Monitoring Agent (agents/monitoring_agent.py)
    to verify a previously-created workspace still exists, as part of its
    polling loop.

    Should return {"exists": bool} at minimum.
    """
    raise NotImplementedError("TODO: implement OpenKM workspace status check -- see module docstring")
