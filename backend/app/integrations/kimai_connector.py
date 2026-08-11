"""
Time & Billing Agent -- Kimai connector. Owns the PDD provisioning item
"Time & Billing" (Tax, Audit, Law roles -- not IT Support).

Kimai has a documented, straightforward REST API
(https://www.kimai.org/documentation/rest-api.html) with API-token auth,
so this is one of the more mechanical connectors to implement -- closest
in shape to the existing app/integrations/hrms_connector.py's plain
`requests` calls.

Public connector interface (same shape as keycloak_connector.py /
mailu_connector.py -- the orchestrator and Monitoring Agent import this
module directly and call these two functions):

    create_user_and_timesheet(employee_name, employee_email, role)
    get_user_status(external_ref)

Everything else below (KimaiUserService, KimaiTimesheetService,
KimaiCustomerService, KimaiProjectService, KimaiActivityService) is the
existing lower-level service layer, also used directly by
routers/kimai_routes.py for the manual `/kimai/*` CRUD endpoints.

Resolved (was TODO): no per-role hourly-rate/cost-center config exists
yet (the PDD's Section 13 sample -- $45/hr, cost center TAX-OPS-01,
projects TAX-CLIENT-4471/TAX-INTERNAL-01 -- is Tax-specific sample data,
not a rule to hardcode for every role), so create_user_and_timesheet()
below treats "configure timesheet profile" as: get-or-create one
Customer/Project/Activity chain per role (not a literal timesheet
entry -- there's nothing to log yet on someone's first day). See that
function's docstring for the exact defaults and the follow-up this
still leaves open.
"""

from __future__ import annotations
import secrets
import string
import time

import requests

import os
from app.services import KimaiApiClient
from app.config import Config
from app.error_logger import ErrorLogger
from app.exceptions.kimai_exceptions import KimaiClientServiceError
from dotenv import load_dotenv

load_dotenv()

KIMAI_URL = os.getenv("KIMAI_API_URL", "").rstrip("/")

class KimaiTimesheetService:
    """Creates timesheets using the admin token, on behalf of any employee via the 'user' field.
    Requires the calling account to have admin/manager permissions in Kimai."""

    def __init__(self, api_client: KimaiApiClient, admin_token: str):
        self._api_client = api_client
        self._admin_token = admin_token

    def create_timesheet(
        self,
        kimai_user_id: int,
        project_id: int,
        activity_id: int,
        begin: str,   # format: 2026-08-05T09:00:00 (local time, no timezone suffix)
        end: str,
        description: str = None,
    ) -> dict:
        payload = {
            "user": kimai_user_id,
            "project": project_id,
            "activity": activity_id,
            "begin": begin,
            "end": end,
        }
        if description:
            payload["description"] = description

        return self._api_client.post("/timesheets", self._admin_token, payload)

    def list_timesheets_for_user(self, kimai_user_id: int) -> list:
        params = {"user": kimai_user_id}
        return self._api_client.get("/timesheets", self._admin_token, params=params)

    def get_timesheet(self, timesheet_id: int) -> dict:
        return self._api_client.get(f"/timesheets/{timesheet_id}", self._admin_token)

    def update_timesheet(
        self, timesheet_id: int, begin: str = None, end: str = None, description: str = None
    ) -> dict:
        payload = {}
        if begin is not None:
            payload["begin"] = begin
        if end is not None:
            payload["end"] = end
        if description is not None:
            payload["description"] = description
        return self._api_client.put(f"/timesheets/{timesheet_id}", self._admin_token, payload)

    def delete_timesheet(self, timesheet_id: int) -> bool:
        return self._api_client.delete(f"/timesheets/{timesheet_id}", self._admin_token)


class KimaiUserService:
    """Creates Kimai users using the admin token. Returns the new user's ID and API token
    so the caller can store the token for future timesheet creation."""

    def __init__(self, api_client: KimaiApiClient, config: Config):
        self._api_client = api_client
        self._admin_token = config.kimai_admin_token

    def create_user(self, username: str, email: str, password: str) -> dict:
        payload = {
            "username": username,
            "email": email,
            "plainPassword": password,
            "enabled": True,
        }
        result = self._api_client.post("/users", self._admin_token, payload)
        return {
            "kimai_user_id": result.get("id"),
            "username": result.get("username"),
            "email": result.get("email"),
        }

    def list_users(self) -> list:
        return self._api_client.get("/users", self._admin_token)

    def get_user(self, kimai_user_id: int) -> dict:
        return self._api_client.get(f"/users/{kimai_user_id}", self._admin_token)


class KimaiCustomerService:
    """Minimal customer support — needed because every Project must belong to a Customer."""

    def __init__(self, api_client: KimaiApiClient, admin_token: str):
        self._api_client = api_client
        self._admin_token = admin_token

    def list_customers(self) -> list:
        return self._api_client.get("/customers", self._admin_token)

    def create_customer(self, name: str, number:str) -> dict:
        payload = {"name": name, "number": number}
        return self._api_client.post("/customers", self._admin_token, payload)
    


class KimaiProjectService:
    """Full CRUD for Kimai Projects."""

    def __init__(self, api_client: KimaiApiClient, admin_token: str):
        self._api_client = api_client
        self._admin_token = admin_token
        self.kimai_time_sheet_service=KimaiTimesheetService(api_client,admin_token)

    def create_project(self, name: str, customer_id: int, visible: bool = True) -> dict:
        payload = {"name": name, "customer": customer_id, "visible": visible}
        return self._api_client.post("/projects", self._admin_token, payload)

    def list_projects(self) -> list:
        return self._api_client.get("/projects", self._admin_token)

    def get_project(self, project_id: int) -> dict:
        return self._api_client.get(f"/projects/{project_id}", self._admin_token)

    def update_project(self, project_id: int, name: str = None, visible: bool = None) -> dict:
        payload = {}
        if name is not None:
            payload["name"] = name
        if visible is not None:
            payload["visible"] = visible
        return self._api_client.put(f"/projects/{project_id}", self._admin_token, payload)

    def delete_project(self, project_id: int) -> bool:
        return self._api_client.delete(f"/projects/{project_id}", self._admin_token)

    def get_projects_used_by_user(self, kimai_user_id: int) -> list:
        """Derives 'this employee's projects' from their actual timesheet history,
        since Kimai doesn't scope Projects to users directly."""
        timesheets = self.kimai_time_sheet_service.list_timesheets_for_user(kimai_user_id)
        seen = {}
        for t in timesheets:
            project_id = t.get("project")
            if project_id and project_id not in seen:
                seen[project_id] = True
        return list(seen.keys())

class KimaiActivityService:
    """Full CRUD for Kimai Activities, including billable configuration."""

    def __init__(self, api_client: KimaiApiClient, admin_token: str):
        self._api_client = api_client
        self._admin_token = admin_token

    def create_activity(self, name: str, project_id: int = None, billable: bool = True, visible: bool = True) -> dict:
        payload = {"name": name, "billable": billable, "visible": visible}
        if project_id is not None:
            payload["project"] = project_id  # omit for a "global" activity, not tied to one project
        return self._api_client.post("/activities", self._admin_token, payload)

    def list_activities(self, project_id: int = None) -> list:
        params = {"project": project_id} if project_id else {}
        return self._api_client.get("/activities", self._admin_token, params=params)

    def get_activity(self, activity_id: int) -> dict:
        return self._api_client.get(f"/activities/{activity_id}", self._admin_token)

    def update_activity(self, activity_id: int, name: str = None, billable: bool = None, visible: bool = None) -> dict:
        payload = {}
        if name is not None:
            payload["name"] = name
        if billable is not None:
            payload["billable"] = billable
        if visible is not None:
            payload["visible"] = visible
        return self._api_client.put(f"/activities/{activity_id}", self._admin_token, payload)

    def delete_activity(self, activity_id: int) -> bool:
        return self._api_client.delete(f"/activities/{activity_id}", self._admin_token)

    def set_rates_for_activity(self, activity_id: int, hourly_rate: float, internal_rate: float) -> dict:
        payload = {
            "hourlyRate": hourly_rate,
            "internalRate": internal_rate
        }
        return self._api_client.put(f"/activities/{activity_id}/rates", self._admin_token, payload)


# ----------------------------------------------------------------------
# Connector-level error (wraps the lower-level KimaiClientServiceError,
# same relationship as KeycloakConnectorError wraps httpx errors and
# MailUConnectorError wraps httpx errors)
# ----------------------------------------------------------------------


class KimaiConnectorError(Exception):
    """Raised on any Kimai failure surfaced through this module's public
    interface (create_user_and_timesheet, get_user_status). status_code
    is best-effort only -- KimaiClientServiceError (raised by the
    lower-level KimaiApiClient) carries the status inside its message
    text rather than as a separate attribute, so it's parsed out here
    when present rather than guaranteed."""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


def _status_code_from(exc: Exception) -> int | None:
    for code in (404, 400, 401, 403, 409, 422, 500, 502, 503):
        if str(code) in str(exc):
            return code
    return None


# ----------------------------------------------------------------------
# Module-level service instances -- same construction as
# routers/kimai_routes.py, kept independent since the two modules have
# no shared DI container in this codebase.
# ----------------------------------------------------------------------

_config = Config()
_logger = ErrorLogger()
_api_client = KimaiApiClient(_config, _logger)
_user_service = KimaiUserService(_api_client, _config)
_customer_service = KimaiCustomerService(_api_client, _config.kimai_admin_token)
_project_service = KimaiProjectService(_api_client, _config.kimai_admin_token)
_activity_service = KimaiActivityService(_api_client, _config.kimai_admin_token)

_TEMP_PASSWORD_LENGTH = 16
_DEFAULT_ACTIVITY_NAME = "General"
_TIMEOUT_SECONDS = 10.0

# Kimai's base REST URL, exposed at module level (same convention as
# MAILU_URL/OPENKM_URL in their respective connectors) so
# health_check_orchestrator.py has one source of truth instead of
# re-reading KIMAI_API_URL under a new name. Reused from the
# already-constructed KimaiApiClient rather than re-deriving from
# _config, since KimaiApiClient.__init__ already did the .rstrip("/").
KIMAI_URL = _api_client._base_url


# ----------------------------------------------------------------------
# Domain logic
# ----------------------------------------------------------------------


def _generate_username(employee_email: str) -> str:
    """Same convention as keycloak_connector._generate_username --
    local part of the employee's email, lowercased."""
    return employee_email.split("@", 1)[0].strip().lower()


def _generate_temp_password(length: int = _TEMP_PASSWORD_LENGTH) -> str:
    """Same convention as mailu_connector/openkm_connector -- a random
    cryptographically-strong temp password, since Kimai (like MailU) has
    no separate invite/reset-link flow exposed here."""
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _find_user_by_username(username: str) -> dict | None:
    """Kimai's /users list endpoint doesn't reliably filter by exact
    username across versions, so this filters client-side -- same
    approach as openkm_connector._list_usernames(). Returns None (not a
    raise) when not found, since 'no such user yet' is the expected,
    common case here (not an error)."""
    for user in _user_service.list_users():
        if user.get("username") == username:
            return user
    return None


def _get_or_create_customer(role: str) -> dict:
    """One Kimai Customer per role (e.g. 'Tax', 'Audit', 'Law'), created
    once and reused for every employee in that role thereafter."""
    for customer in _customer_service.list_customers():
        if customer.get("name") == role:
            return customer
    number = f"{role.upper().replace(' ', '-')}-OPS-01"
    return _customer_service.create_customer(role, number)


def _get_or_create_project(role: str, customer_id: int) -> dict:
    """One Kimai Project per role, under that role's Customer."""
    project_name = f"{role} Internal"
    for project in _project_service.list_projects():
        if project.get("name") == project_name:
            return project
    return _project_service.create_project(project_name, customer_id, visible=True)


def _get_or_create_activity(project_id: int) -> dict:
    """One default, billable Activity per project -- enough for an
    employee to log time against from day one. Role-specific activities
    (if ever needed) are a follow-up, not required for onboarding."""
    for activity in _activity_service.list_activities(project_id=project_id):
        if activity.get("name") == _DEFAULT_ACTIVITY_NAME:
            return activity
    return _activity_service.create_activity(
        _DEFAULT_ACTIVITY_NAME, project_id=project_id, billable=True, visible=True
    )


# ----------------------------------------------------------------------
# Public connector interface
# ----------------------------------------------------------------------


def create_user_and_timesheet(employee_name: str, employee_email: str, role: str) -> dict:
    """
    Provisions Kimai access for a newly onboarded employee -- the "Time
    & Billing" provisioning item (Tax/Audit/Law roles).

    Two parts:
    1. Kimai user account -- idempotent: if a user with this username
       already exists (reused across reruns, same spirit as
       openkm_connector.create_workspace), it's reused rather than
       erroring; only a freshly-created account gets a fresh temp
       password (Kimai never exposes an existing user's password, so
       there's nothing to return for a reused account).
    2. "Timesheet profile" -- resolved here as a get-or-create
       Customer -> Project -> Activity chain scoped to the employee's
       role (Customer named after the role, Project "{role} Internal",
       Activity "General"), NOT a literal timesheet entry -- there's no
       work to log yet on someone's first day. Real time entries are
       created later by the employee (or via POST /kimai/timesheets),
       once they're actually working.

    NOTE (flagging, not deciding here -- see this module's docstring):
    no per-role hourly-rate/cost-center config exists yet, so this
    deliberately does not set a per-employee rate on the Kimai user or
    activity. If/when that becomes a real requirement, extend
    _get_or_create_activity() (or set_rates_for_activity()) once the
    actual per-role numbers are confirmed -- not something to guess at
    here.

    Returns {"external_ref": "<kimai-user-id>", "username": "...",
    "temp_password": "..." (None if the account already existed),
    "detail": "..."}.
    Raises KimaiConnectorError on failure.

    Called from: app/orchestrators/onboarding_orchestrator.py, via
    _PROVISIONING_CALLS["time_billing"].
    """
    try:
        username = _generate_username(employee_email)
        existing = _find_user_by_username(username)

        if existing:
            kimai_user_id = existing.get("id")
            temp_password = None
            account_note = f"Kimai account '{username}' already existed (reused, no password reset performed)."
        else:
            temp_password = _generate_temp_password()
            created = _user_service.create_user(username, employee_email, temp_password)
            kimai_user_id = created.get("kimai_user_id")
            if not kimai_user_id:
                raise KimaiConnectorError(f"Kimai returned no user id after creating '{username}': {created}")
            account_note = f"Kimai account '{username}' created."

        customer = _get_or_create_customer(role)
        project = _get_or_create_project(role, customer["id"])
        _get_or_create_activity(project["id"])

        return {
            "external_ref": kimai_user_id,
            "username": username,
            "temp_password": temp_password,
            "detail": (
                f"{account_note} Timesheet profile ready "
                f"(customer='{customer.get('name')}', project='{project.get('name')}')."
            ),
        }
    except KimaiConnectorError:
        raise
    except KimaiClientServiceError as exc:
        raise KimaiConnectorError(
            f"Failed to provision Kimai access for '{employee_email}': {exc}",
            status_code=_status_code_from(exc),
        ) from exc
    except Exception as exc:
        raise KimaiConnectorError(f"Failed to provision Kimai access for '{employee_email}': {exc}") from exc


def get_user_status(external_ref) -> dict:
    """
    Look up a previously-created Kimai user by id.

    Returns {"exists": bool, "enabled": bool}. A 404 from Kimai is
    reported as {"exists": False, "enabled": False} rather than an
    error -- same convention as keycloak_connector.get_user_status /
    mailu_connector.get_mailbox_status / openkm_connector's status
    check; any other failure raises KimaiConnectorError.

    Used by the Monitoring Agent's polling loop -- wired into
    agents/monitoring_agent.py's STATUS_CHECKERS["time_billing"].
    """
    try:
        user = _user_service.get_user(external_ref)
        return {"exists": True, "enabled": bool(user.get("enabled", True))}
    except KimaiClientServiceError as exc:
        status_code = _status_code_from(exc)
        if status_code == 404:
            return {"exists": False, "enabled": False}
        raise KimaiConnectorError(f"Failed to fetch Kimai user status for '{external_ref}': {exc}", status_code=status_code) from exc
    except Exception as exc:
        raise KimaiConnectorError(f"Failed to fetch Kimai user status for '{external_ref}': {exc}") from exc


def check_kimai_latency() -> dict:
    """
    Measure round-trip latency to Kimai and report reachability.

    Hits GET {KIMAI_URL}/users with the admin bearer token -- the same
    endpoint _find_user_by_username() above already relies on via
    KimaiUserService.list_users() -- since Kimai's REST API has no
    dedicated unauthenticated ping/health endpoint. This is a raw
    `requests` call rather than going through KimaiApiClient/
    KimaiUserService, so a non-200 response is reported here as DOWN
    with a status_code/latency reading instead of being raised as
    KimaiClientServiceError -- same tradeoff (and same reason) as
    openkm_connector.check_openkm_latency() / mailu_connector.check_mailu_latency().

    Returns:
        {
            "status": "UP" | "DOWN",
            "status_code": int | None,
            "latency_ms": float,
            "error": str | None,
        }

    Never raises KimaiConnectorError -- unreachable/misconfigured Kimai
    is reported as status="DOWN" with the error message, since this
    function IS the diagnostic for that situation.
    """
    start = time.perf_counter()
    try:
        response = requests.get(
            f"{KIMAI_URL}/users",
            headers={"Authorization": f"Bearer {_config.kimai_admin_token}"},
            timeout=_TIMEOUT_SECONDS,
        )
        latency_ms = round((time.perf_counter() - start) * 1000, 2)
        return {
            "status": "UP" if response.status_code == 200 else "DOWN",
            "status_code": response.status_code,
            "latency_ms": latency_ms,
            "error": None,
        }
    except requests.RequestException as exc:
        latency_ms = round((time.perf_counter() - start) * 1000, 2)
        return {
            "status": "DOWN",
            "status_code": None,
            "latency_ms": latency_ms,
            "error": str(exc),
        }