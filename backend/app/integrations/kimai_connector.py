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

from app.services import KimaiApiClient
from app.config import Config
from app.services import KimaiApiClient

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

class KimaiCustomerService:
    """Minimal customer support — needed because every Project must belong to a Customer."""

    def __init__(self, api_client: KimaiApiClient, admin_token: str):
        self._api_client = api_client
        self._admin_token = admin_token

    def list_customers(self) -> list:
        return self._api_client.get("/customers", self._admin_token)


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