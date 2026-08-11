"""
Identity Agent -- Keycloak connector. Owns PDD provisioning items:
"Identity Account Creation" (all roles) and "Helpdesk Admin Role
(scoped)" (IT Support role only).

This is a plain, synchronous connector module -- no FastAPI, no HTTP
endpoints, no Pydantic models. The orchestrator imports it directly and
calls its two public functions:

    create_user(employee_name, employee_email, role, scoped_role=False)
    get_user_status(external_ref)

Everything else in this module is a private helper, refactored (not
rewritten) from the original async KeycloakClient / KeycloakAuth /
KeycloakService trio:
  - `_get_admin_token()`      <- KeycloakAuth.get_admin_token / _fetch_new_token
  - `_request()`              <- KeycloakClient.request / _request_with_retry
  - `_generate_username()`    <- KeycloakService.generate_username (unchanged algorithm)
  - `_create_keycloak_user()` <- KeycloakService.create_user
  - `_assign_role()`          <- KeycloakService.assign_role
  - `_find_role()`            <- KeycloakService.find_role / get_role
  - `_find_user_by_username()`<- KeycloakService.find_user_by_username
  - `_get_user()`             <- KeycloakService.get_user

Notable adaptation: the original admin-token flow used the Resource
Owner Password grant (admin username/password) against a separate
`keycloak_auth_realm` ("master"). This connector's env-var contract is
limited to KEYCLOAK_URL / KEYCLOAK_REALM / KEYCLOAK_ADMIN_CLIENT_ID /
KEYCLOAK_ADMIN_CLIENT_SECRET, so `_get_admin_token()` instead uses the
Client Credentials grant (a confidential/service-account client in
KEYCLOAK_REALM) -- same caching/retry-on-401 behaviour, different grant
type. If your Keycloak admin client actually lives in a different
realm (e.g. "master"), point KEYCLOAK_REALM there or extend
`_TOKEN_REALM` below.
"""

from __future__ import annotations
from dotenv import load_dotenv
import os
import threading
import time
from typing import Any

import httpx
load_dotenv()
KEYCLOAK_URL = os.getenv("KEYCLOAK_URL").rstrip("/")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM")
KEYCLOAK_ADMIN_CLIENT_ID = os.getenv("KEYCLOAK_ADMIN_CLIENT_ID")
KEYCLOAK_ADMIN_CLIENT_SECRET = os.getenv("KEYCLOAK_ADMIN_CLIENT_SECRET")

_TIMEOUT_SECONDS = 10.0
_TOKEN_EXPIRY_SAFETY_MARGIN_SECONDS = 5

# Realm used to obtain the admin/service-account token. Defaults to the
# managed realm itself (client-credentials grant); override here if your
# admin client actually lives in a different realm (e.g. "master").
_TOKEN_REALM = KEYCLOAK_REALM

# Scoped role for the IT Support "Helpdesk Admin Role (scoped)"
# provisioning item (see provisioning_matrix.json) -- a limited role
# within the same real Keycloak instance, NOT full admin access.
# Must exist in KEYCLOAK_REALM already; rename here if your realm uses
# a different role name for it.
_SCOPED_HELPDESK_ROLE = os.getenv(
    "KEYCLOAK_SCOPED_HELPDESK_ROLE",
    "helpdesk-admin-scoped"
)


class KeycloakConnectorError(Exception):
    """Raised on any Keycloak failure (auth, network, 4xx/5xx, ...)."""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


def check_keycloak_latency() -> dict:
    """
    Measure round-trip latency to Keycloak and report reachability.

    Hits the unauthenticated realm endpoint ({KEYCLOAK_URL}/realms/
    {KEYCLOAK_REALM}) -- no admin token needed, so this works even if
    the service-account client/credentials are misconfigured and is
    useful as an independent first check when create_user() or
    get_user_status() start failing.

    Returns:
        {
            "status": "UP" | "DOWN",
            "status_code": int | None,
            "latency_ms": float,
            "error": str | None,
        }

    Never raises KeycloakConnectorError -- unreachable/misconfigured
    Keycloak is reported as status="DOWN" with the error message, since
    this function IS the diagnostic for that situation.
    """
    if not KEYCLOAK_URL or not KEYCLOAK_REALM:
        return {
            "status": "DOWN",
            "status_code": None,
            "latency_ms": 0.0,
            "error": "Missing KEYCLOAK_URL and/or KEYCLOAK_REALM environment variables",
        }

    url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}"
    start = time.perf_counter()
    try:
        response = httpx.get(url, timeout=_TIMEOUT_SECONDS)
        latency_ms = round((time.perf_counter() - start) * 1000, 2)
        return {
            "status": "UP" if response.status_code == 200 else "DOWN",
            "status_code": response.status_code,
            "latency_ms": latency_ms,
            "error": None,
        }
    except httpx.RequestError as exc:
        latency_ms = round((time.perf_counter() - start) * 1000, 2)
        return {
            "status": "DOWN",
            "status_code": None,
            "latency_ms": latency_ms,
            "error": str(exc),
        }



# ----------------------------------------------------------------------
# Token management (was KeycloakAuth)
# ----------------------------------------------------------------------

_token_lock = threading.Lock()
_cached_token: str | None = None
_token_expires_at: float = 0.0


def _require_env() -> None:
    missing = [
        name
        for name, value in (
            ("KEYCLOAK_URL", KEYCLOAK_URL),
            ("KEYCLOAK_REALM", KEYCLOAK_REALM),
            ("KEYCLOAK_ADMIN_CLIENT_ID", KEYCLOAK_ADMIN_CLIENT_ID),
            ("KEYCLOAK_ADMIN_CLIENT_SECRET", KEYCLOAK_ADMIN_CLIENT_SECRET),
        )
        if not value
    ]
    if missing:
        raise KeycloakConnectorError(
            f"Missing required environment variables: {', '.join(missing)}"
        )


def _is_token_valid() -> bool:
    return bool(_cached_token) and time.monotonic() < _token_expires_at


def _get_admin_token(force_refresh: bool = False) -> str:
    """Return a valid (cached or freshly fetched) admin access token."""
    global _cached_token, _token_expires_at

    if not force_refresh and _is_token_valid():
        return _cached_token  # type: ignore[return-value]

    with _token_lock:
        if not force_refresh and _is_token_valid():
            return _cached_token  # type: ignore[return-value]

        _require_env()

        data = {
            "grant_type": "client_credentials",
            "client_id": KEYCLOAK_ADMIN_CLIENT_ID,
            "client_secret": KEYCLOAK_ADMIN_CLIENT_SECRET,
        }
        token_url = f"{KEYCLOAK_URL}/realms/{_TOKEN_REALM}/protocol/openid-connect/token"

        try:
            response = httpx.post(
                token_url,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=_TIMEOUT_SECONDS,
            )
        except httpx.RequestError as exc:
            raise KeycloakConnectorError(f"Could not connect to Keycloak: {exc}") from exc

        if response.status_code != 200:
            raise KeycloakConnectorError(
                "Failed to authenticate admin client with Keycloak: "
                f"{response.status_code} {response.text}",
                status_code=response.status_code,
            )

        payload = response.json()
        _cached_token = payload["access_token"]
        expires_in = int(payload.get("expires_in", 60))
        _token_expires_at = time.monotonic() + max(expires_in - _TOKEN_EXPIRY_SAFETY_MARGIN_SECONDS, 1)
        return _cached_token


def _invalidate_token() -> None:
    global _cached_token, _token_expires_at
    _cached_token = None
    _token_expires_at = 0.0


# ----------------------------------------------------------------------
# HTTP transport (was KeycloakClient)
# ----------------------------------------------------------------------


def _admin_base_url() -> str:
    return f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}"


def _extract_id_from_location(response: httpx.Response) -> str | None:
    """
    Keycloak's create endpoints (users, roles, ...) return 201 with no
    body but a `Location` header like `.../admin/realms/{realm}/users/{id}`.
    """
    location = response.headers.get("Location")
    if not location:
        return None
    return location.rstrip("/").split("/")[-1]


def _request(
    method: str,
    path: str,
    *,
    json: Any = None,
    params: dict[str, Any] | None = None,
    _retried: bool = False,
) -> httpx.Response:
    """
    Authenticated request against the Keycloak Admin API. Retries exactly
    once, with a freshly fetched token, on a 401. Any other non-2xx
    status raises `KeycloakConnectorError`.
    """
    token = _get_admin_token(force_refresh=_retried)
    url = f"{_admin_base_url()}{path}"
    headers = {"Authorization": f"Bearer {token}"}

    try:
        response = httpx.request(
            method, url, json=json, params=params, headers=headers, timeout=_TIMEOUT_SECONDS
        )
    except httpx.RequestError as exc:
        raise KeycloakConnectorError(f"Network error calling Keycloak ({method} {url}): {exc}") from exc

    if response.status_code == 401 and not _retried:
        _invalidate_token()
        return _request(method, path, json=json, params=params, _retried=True)

    if not response.is_success:
        try:
            detail = response.json()
        except ValueError:
            detail = response.text
        raise KeycloakConnectorError(
            f"Keycloak error: {method} {url} -> {response.status_code} | {detail}",
            status_code=response.status_code,
        )

    return response


# ----------------------------------------------------------------------
# Domain logic (was KeycloakService)
# ----------------------------------------------------------------------


def _generate_username(employee_email: str) -> str:
    return employee_email.split("@", 1)[0].strip().lower()


def _find_user_by_username(username: str) -> dict:
    """Find a user by exact username match."""
    response = _request("GET", "/users", params={"username": username, "exact": "true"})
    for item in response.json():
        if item.get("username") == username:
            return item
    raise KeycloakConnectorError(f"User '{username}' not found after creation")


def _get_user(user_id: str) -> dict:
    """Return a single Keycloak user by ID."""
    response = _request("GET", f"/users/{user_id}")
    return response.json()


def _find_role(role_name: str) -> dict:
    """Find a realm role by exact name."""
    response = _request("GET", f"/roles/{role_name}")
    return response.json()


def _assign_role(user_id: str, role_name: str) -> None:
    """Assign a realm role to a user."""
    role = _find_role(role_name)
    _request("POST", f"/users/{user_id}/role-mappings/realm", json=[role])


def _create_keycloak_user(username: str, employee_name: str, employee_email: str) -> str:
    """
    Create the Keycloak user (username == generated username, password ==
    generated username per PDD) and return its Keycloak UUID.
    """
    name_parts = employee_name.strip().split(" ", 1)
    first_name = name_parts[0] if name_parts else employee_name
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    payload = {
        "username": username,
        "email": employee_email,
        "firstName": first_name,
        "lastName": last_name,
        "enabled": True,
        "credentials": [{"type": "password", "value": username, "temporary": True}],
    }

    response = _request("POST", "/users", json=payload)

    user_id = _extract_id_from_location(response)
    if not user_id:
        user_id = _find_user_by_username(username)["id"]

    return user_id


# ----------------------------------------------------------------------
# Public connector interface
# ----------------------------------------------------------------------


def create_user(employee_name: str, employee_email: str, role: str, scoped_role: bool = False) -> dict:
    """
    Create the Keycloak identity account for a new employee and assign
    the appropriate role.

    - scoped_role=False: assigns `role` (the default role for the
      employee, per PDD Section 3 "assign default role").
    - scoped_role=True: assigns the scoped Helpdesk Admin role instead
      (IT Support's "Helpdesk Admin Role (scoped)" provisioning item).

    Returns {"external_ref": "<keycloak-user-uuid>", "username": "...",
    "password": "...", "detail": "..."}. `password` is the same value set
    as the initial credential in `_create_keycloak_user()` (username==
    password per PDD) so the orchestrator can plumb it into the welcome
    email -- see mailu_connector.create_mailbox()'s return shape for the
    equivalent on the email side.
    Raises KeycloakConnectorError on any failure.
    """
    try:
        username = _generate_username(employee_email)
        user_id = _create_keycloak_user(username, employee_name, employee_email)

        role_to_assign = _SCOPED_HELPDESK_ROLE if scoped_role else role
        _assign_role(user_id, role_to_assign)

        return {
            "external_ref": user_id,
            "username": username,
            "password": username,
            "detail": "Identity account created.",
        }
    except KeycloakConnectorError:
        raise
    except Exception as exc:
        raise KeycloakConnectorError(f"Failed to create Keycloak user: {exc}") from exc


def get_user_status(external_ref: str) -> dict:
    """
    Look up a previously-created Keycloak user by UUID.

    Returns {"exists": bool, "enabled": bool}. A 404 from Keycloak is
    reported as {"exists": False, "enabled": False} rather than an
    error; any other failure raises KeycloakConnectorError.
    """
    try:
        user = _get_user(external_ref)
        return {"exists": True, "enabled": bool(user.get("enabled", False))}
    except KeycloakConnectorError as exc:
        if exc.status_code == 404:
            return {"exists": False, "enabled": False}
        raise
    except Exception as exc:
        raise KeycloakConnectorError(f"Failed to fetch Keycloak user status: {exc}") from exc
