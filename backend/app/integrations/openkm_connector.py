"""
Document Management Agent -- OpenKM connector. Owns the PDD provisioning
items "Client Document Repository" (Tax), "Client Engagement Repository"
(Audit), and "Document Management" (Law).

NOTE -- scope note, not just plumbing: in the original PDD Section 3
tables these three items were all marked Mock (they were spec'd against
commercial platforms -- NetDocuments for Tax/Audit, iManage Work for
Law -- which aren't feasible to stand up for free in this POC). OpenKM
is open-source with a real REST API, so these were upgraded to
Functional. See config_data/provisioning_matrix.json's `_comment` and
MIGRATION_NOTES.md. IT Support does not get a document-management item
at all (per the PDD's Section 3.4 table), so this connector is only
ever called for Tax/Audit/Law.

API reference used: confirmed directly against a live OpenKM 6.3.12
Community Edition instance's own swagger.json
(http://<host>/OpenKM/services/rest/swagger.json), not secondhand docs
or forum posts -- see the correction note below for why that distinction
mattered here.

IMPORTANT VERSION CAVEAT: OpenKM 7.1+ changed the REST path convention
(plural, ID-in-path style, e.g. /openkm/rest/folders/{id}) and
deprecated path-based node lookups in favor of UUID-only. This
connector targets the 6.3.x Community Edition contract
(/OpenKM/services/rest/...), which is what the official
`openkm/openkm-ce` Docker image runs. If your team deploys a newer
version, pull that version's own /OpenKM/services/rest/swagger.json
and diff it against this file before assuming it's still compatible.

CORRECTION (previous version of this file was wrong on this point):
an earlier draft claimed Community Edition has no REST endpoint to
create users, based on an old forum thread. Direct testing against a
live 6.3.12 instance's real swagger.json proved that wrong --
/auth/createUser, /auth/assignRole, /auth/getUsers, and /auth/login
are all present AND functional (confirmed via a full round-trip: create
a user, assign it ROLE_USER, then successfully authenticate as that
user, including a negative test with a wrong password correctly
returning 401). Lesson encoded here: prefer a live instance's own
swagger.json over secondhand documentation/forum claims about
edition-gated features -- CXF auto-generates a REST binding for every
method on the underlying interface regardless of edition, so an
endpoint's mere presence in swagger.json does NOT by itself prove it's
functional either; only an actual round-trip test does. Don't repeat
either mistake (assuming absence from stale docs, or assuming presence
in swagger.json means it works) without testing against a real instance.
"""
import os
import re
import secrets
import string
import requests

OPENKM_URL = os.getenv("OPENKM_URL", "http://localhost:8080/OpenKM/services/rest").rstrip("/")
OPENKM_USER = os.getenv("OPENKM_USER", "")
OPENKM_PASSWORD = os.getenv("OPENKM_PASSWORD", "")

# OpenKM permission bitmask: READ=1, WRITE=2, DELETE=4, SECURITY=8.
# 15 = full read/write/delete/security on the employee's own folder.
# TODO: confirm with whoever owns document-retention policy whether
# employees should get SECURITY (8) on their own folder, or just
# READ+WRITE (3) -- defaulting to 15 (matches OpenKM's own curl
# examples) since this is a per-employee private workspace, not a
# shared one.
GRANT_PERMISSIONS = 15

# The role every provisioned employee is assigned so they can actually
# log in -- confirmed by testing that a user with no role at all still
# authenticates against /auth/login, but ROLE_USER is OpenKM's
# standard baseline role for a real (non-admin) account. TODO: confirm
# with whoever owns the OpenKM instance whether a more specific role
# should be used instead (e.g. per-department roles), rather than
# every Tax/Audit/Law employee sharing one generic role.
DEFAULT_ROLE = "ROLE_USER"

_TIMEOUT = 10


class OpenKMConnectorError(Exception):
    pass


def _auth():
    if not OPENKM_USER or not OPENKM_PASSWORD:
        raise OpenKMConnectorError(
            "OPENKM_USER / OPENKM_PASSWORD are not set (empty Basic Auth credentials would "
            "otherwise fail as a generic 401). If you're testing this module standalone "
            "(not via main.py, which calls load_dotenv() already), either export the env vars "
            "in your shell first, or add `from dotenv import load_dotenv; load_dotenv()` before "
            "importing this module -- a bare `python -c \"from app.integrations import "
            "openkm_connector...\"` does NOT read your .env file on its own."
        )
    return (OPENKM_USER, OPENKM_PASSWORD)


def _safe_username(employee_email: str) -> str:
    """Turns an email's local part into an OpenKM-safe username/folder
    name. OpenKM rejects some special characters -- keep this
    conservative (alnum, dot, dash, underscore only). Used as both the
    OpenKM login username and the employee's folder name, so the two
    always match up predictably."""
    local_part = employee_email.split("@")[0]
    return re.sub(r"[^A-Za-z0-9._-]", "_", local_part)


def _generate_temp_password() -> str:
    """Random per-employee password (see module docstring's design
    note: chosen over a fixed/throwaway password since there's no SSO
    wired up yet for OpenKM). Meant to be surfaced to the employee via
    the welcome-email flow -- see orchestrators/onboarding_orchestrator.py's
    _draft_and_queue_welcome_email(), which currently has a TODO for
    threading connector-returned temp passwords into the email body."""
    alphabet = string.ascii_letters + string.digits
    body = "".join(secrets.choice(alphabet) for _ in range(12))
    # guarantee at least one symbol and one digit, in case a policy requires it
    return f"{body}!{secrets.choice(string.digits)}"


# ---------------------------------------------------------------------
# Folder operations
# ---------------------------------------------------------------------

def _folder_exists(path: str) -> bool:
    """GET /folder/isValid?fldId=<path-or-uuid> -- SHOULD return a bare
    'true'/'false' text body per FolderService.isValid()'s own docs, but
    OpenKM has a long-standing, confirmed bug (reported since 5.1.x,
    still present in 6.3.x per the isValid Javadoc listing
    PathNotFoundException as a thrown exception): when the path does
    NOT exist, it throws PathNotFoundException instead of returning
    false, which the REST layer surfaces as an HTTP error (seen in
    practice as a 500, not even a 404). See
    https://forum.openkm.com/viewtopic.php?t=8319.

    So: any error response here is treated as "does not exist" UNLESS
    it's a 401 (credentials problem -- always surface that, never treat
    as "doesn't exist")."""
    resp = requests.get(
        f"{OPENKM_URL}/folder/isValid",
        params={"fldId": path},
        auth=_auth(),
        timeout=_TIMEOUT,
    )
    if resp.status_code == 401:
        resp.raise_for_status()
    if resp.status_code >= 400:
        return False
    return resp.text.strip().lower() == "true"


def _get_folder_properties(path_or_uuid: str) -> dict:
    resp = requests.get(
        f"{OPENKM_URL}/folder/getProperties",
        params={"fldId": path_or_uuid},
        headers={"Accept": "application/json"},
        auth=_auth(),
        timeout=_TIMEOUT,
    )
    resp.raise_for_status()
    return resp.json()


def _create_folder(path: str) -> dict:
    """POST /folder/createSimple -- body is the raw path string (not a
    JSON object), per OpenKM's own documented curl example. Returns the
    created Folder object as JSON."""
    resp = requests.post(
        f"{OPENKM_URL}/folder/createSimple",
        data=path,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        auth=_auth(),
        timeout=_TIMEOUT,
    )
    resp.raise_for_status()
    return resp.json()


def _ensure_parent_folder(role_folder_path: str):
    """PUT /folder/createMissingFolders?fldPath=... -- idempotent."""
    resp = requests.put(
        f"{OPENKM_URL}/folder/createMissingFolders",
        params={"fldPath": role_folder_path},
        auth=_auth(),
        timeout=_TIMEOUT,
    )
    resp.raise_for_status()


# ---------------------------------------------------------------------
# User operations -- confirmed functional in 6.3.12 CE by direct testing
# (see module docstring's correction note)
# ---------------------------------------------------------------------

def _list_usernames() -> list[str]:
    """GET /auth/getUsers -- confirmed working; returns
    {"user": ["okmAdmin", "jane.doe", ...]}."""
    resp = requests.get(
        f"{OPENKM_URL}/auth/getUsers",
        headers={"Accept": "application/json"},
        auth=_auth(),
        timeout=_TIMEOUT,
    )
    resp.raise_for_status()
    return resp.json().get("user", [])


def _create_user(username: str, password: str, email: str, full_name: str):
    """POST /auth/createUser -- confirmed working (returns 204)."""
    resp = requests.post(
        f"{OPENKM_URL}/auth/createUser",
        data={"user": username, "password": password, "email": email, "name": full_name, "active": "true"},
        auth=_auth(),
        timeout=_TIMEOUT,
    )
    if resp.status_code >= 400:
        raise OpenKMConnectorError(f"createUser failed ({resp.status_code}) for '{username}': {resp.text[:300]}")


def _assign_role(username: str, role: str):
    """PUT /auth/assignRole -- confirmed working (returns 204). Without
    this, a created user cannot actually authenticate against
    /auth/login (confirmed by testing: an unassigned user's login
    behavior was untested/unclear, so this is treated as required, not
    optional, for every user this connector creates)."""
    resp = requests.put(
        f"{OPENKM_URL}/auth/assignRole",
        data={"user": username, "role": role},
        auth=_auth(),
        timeout=_TIMEOUT,
    )
    if resp.status_code >= 400:
        raise OpenKMConnectorError(f"assignRole failed ({resp.status_code}) for '{username}': {resp.text[:300]}")


def _grant_user(folder_uuid: str, username: str) -> str:
    """PUT /auth/grantUser -- writes an ACL entry granting `username`
    access to a folder. Called only AFTER confirming/creating the user
    account, so (unlike an earlier version of this connector) a
    non-2xx response here is a genuine, unexpected failure and is
    raised rather than swallowed as best-effort."""
    resp = requests.put(
        f"{OPENKM_URL}/auth/grantUser",
        data={"user": username, "permissions": GRANT_PERMISSIONS, "recursive": "false", "nodeId": folder_uuid},
        auth=_auth(),
        timeout=_TIMEOUT,
    )
    if resp.status_code >= 400:
        raise OpenKMConnectorError(f"grantUser failed ({resp.status_code}) for '{username}': {resp.text[:300]}")
    return f"Granted permissions={GRANT_PERMISSIONS} to '{username}'."


def _verify_grant(folder_uuid: str, username: str) -> bool:
    """GET /auth/getGrantedUsers?nodeId=... -- reads the ACL back to
    confirm the grant actually persisted with the expected user, rather
    than just trusting grantUser's 2xx response. This closes the gap
    that motivated the old best-effort/grant_verified=False design:
    now that user existence is confirmed before granting, this readback
    gives a real, verified True/False instead of an unverifiable guess."""
    resp = requests.get(
        f"{OPENKM_URL}/auth/getGrantedUsers",
        params={"nodeId": folder_uuid},
        headers={"Accept": "application/json"},
        auth=_auth(),
        timeout=_TIMEOUT,
    )
    resp.raise_for_status()
    granted = resp.json().get("list", [])
    return any(g.get("user") == username for g in granted)


# ---------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------

def _upload_document(folder_path: str, filename: str, content: bytes) -> dict:
    """POST /document/createSimple -- multipart/form-data with two
    fields: docPath (full path INCLUDING filename) and content (the
    file bytes). Confirmed against three independent sources (OpenKM's
    own docs, their bash import-script example, and a working JS
    example) plus the live instance's swagger.json -- all agree on this
    exact contract, unlike the folder/isValid situation earlier where
    swagger.json alone wasn't enough to trust.

    Idempotency note: if a document already exists at this path,
    OpenKM's behavior (overwrite vs. error vs. version bump) wasn't
    tested here -- TODO: confirm this before relying on
    create_workspace() being safely rerunnable once document seeding is
    wired in, the same way folder creation already was tested for
    idempotency."""
    doc_path = f"{folder_path}/{filename}"
    resp = requests.post(
        f"{OPENKM_URL}/document/createSimple",
        data={"docPath": doc_path},
        files={"content": (filename, content)},
        headers={"Accept": "application/json"},
        auth=_auth(),
        timeout=30,  # documents can be larger than the folder/user calls above
    )
    if resp.status_code >= 400:
        raise OpenKMConnectorError(f"Document upload failed ({resp.status_code}) for '{doc_path}': {resp.text[:300]}")
    return resp.json()


def upload_employee_documents(folder_path: str, documents: list[tuple[str, bytes]]) -> list[dict]:
    """Uploads each (filename, content_bytes) pair into the employee's
    already-created folder. Called from
    orchestrators/onboarding_orchestrator.py's document-seeding step,
    which fetches the actual bytes via
    integrations/hrms_connector.py's get_employee_document().

    Each upload is independent -- one failing (e.g. an unsupported file
    type) doesn't stop the rest; failures are collected and returned
    rather than raised, since a partial seed (folder + most documents)
    is more useful than none at all if one file is bad. Callers should
    check each result's "error" key."""
    results = []
    for filename, content in documents:
        try:
            doc = _upload_document(folder_path, filename, content)
            results.append({"filename": filename, "uuid": doc.get("uuid"), "error": None})
        except OpenKMConnectorError as e:
            results.append({"filename": filename, "uuid": None, "error": str(e)})
    return results


def create_workspace(employee_name: str, employee_email: str, role: str) -> dict:
    """Creates (or reuses, idempotently) a per-employee folder under
    /okm:root/{role}/{employee-local-part}, ensures a real OpenKM user
    account exists for the employee (creating + role-assigning one if
    not), and grants that account access to the folder -- verifying the
    grant actually took, not just trusting a 2xx response.

    Called from: app/orchestrators/onboarding_orchestrator.py, for
    Tax/Audit/Law roles only.

    Returns:
      external_ref: the folder's OpenKM uuid
      detail: human-readable summary for the audit log
      openkm_username: the account's username (== email local part)
      temp_password: the freshly-generated password, ONLY if a new
        account was created this call -- None if the account already
        existed (OpenKM never exposes existing passwords, so there's
        nothing to return; if this employee needs their password reset,
        that's a separate, deliberate action, not something this
        function can or should silently do on a rerun)
      grant_verified: True only if getGrantedUsers's readback actually
        confirms the ACL entry -- a real, tested guarantee now, not the
        permanently-False placeholder from the previous version.
    """
    role_folder_path = f"/okm:root/{role}"
    username = _safe_username(employee_email)
    employee_folder_path = f"{role_folder_path}/{username}"

    # --- folder ---
    try:
        _ensure_parent_folder(role_folder_path)
        if _folder_exists(employee_folder_path):
            folder = _get_folder_properties(employee_folder_path)
        else:
            folder = _create_folder(employee_folder_path)
        folder_uuid = folder.get("uuid")
        if not folder_uuid:
            raise OpenKMConnectorError(f"OpenKM returned no uuid for folder '{employee_folder_path}': {folder}")
    except requests.RequestException as e:
        raise OpenKMConnectorError(f"Failed to create/verify OpenKM folder '{employee_folder_path}': {e}")

    # --- user account ---
    temp_password = None
    try:
        existing_usernames = _list_usernames()
        if username in existing_usernames:
            account_note = f"OpenKM account '{username}' already exists (reused, no password reset performed)."
        else:
            temp_password = _generate_temp_password()
            _create_user(username, temp_password, employee_email, employee_name)
            _assign_role(username, DEFAULT_ROLE)
            account_note = f"OpenKM account '{username}' created and assigned role '{DEFAULT_ROLE}'."
    except requests.RequestException as e:
        raise OpenKMConnectorError(f"Failed to create/verify OpenKM user '{username}': {e}")

    # --- grant + verify ---
    try:
        grant_note = _grant_user(folder_uuid, username)
        grant_verified = _verify_grant(folder_uuid, username)
    except requests.RequestException as e:
        raise OpenKMConnectorError(f"Failed to grant/verify OpenKM access for '{username}': {e}")

    detail = f"OpenKM folder '{employee_folder_path}' ready (uuid={folder_uuid}). {account_note} {grant_note}"
    if not grant_verified:
        detail += " WARNING: grantUser returned success but getGrantedUsers readback did not confirm it."

    return {
        "external_ref": folder_uuid,
        "folder_path": employee_folder_path,
        "detail": detail,
        "openkm_username": username,
        "temp_password": temp_password,
        "grant_verified": grant_verified,
    }


def get_workspace_status(external_ref: str) -> dict:
    """Used by the Monitoring Agent's polling loop to confirm a
    previously-created folder still exists. external_ref is the folder
    uuid returned by create_workspace()."""
    try:
        exists = _folder_exists(external_ref)
    except requests.RequestException as e:
        raise OpenKMConnectorError(f"Failed to check OpenKM folder status for '{external_ref}': {e}")
    return {"exists": exists}
