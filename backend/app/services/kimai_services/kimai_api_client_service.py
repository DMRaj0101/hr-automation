import requests
from app.config import Config
from app.error_logger import ErrorLogger
from app.exceptions.kimai_exceptions import KimaiClientServiceError

class KimaiApiClient:
    """Low-level Kimai REST calls. Takes whichever token the caller needs
    (admin token for user management, or a specific employee's token for their own timesheets)."""

    def __init__(self, config: Config, logger: ErrorLogger):
        self._base_url = config.kimai_api_url.rstrip("/")
        self._logger = logger

    def _headers(self, token: str) -> dict:
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

    def post(self, path: str, token: str, payload: dict) -> dict:
        url = f"{self._base_url}{path}"
        response = requests.post(url, headers=self._headers(token), json=payload)

        if response.status_code not in (200, 201):
            self._logger.error(f"Kimai POST {path} failed: {response.status_code} {response.text}")
            raise KimaiClientServiceError(f"Kimai POST {path} failed: {response.text}")

        self._logger.info(f"Kimai POST {path} succeeded")
        return response.json()

    def get(self, path: str, token: str, params: dict = None) -> dict:
        url = f"{self._base_url}{path}"
        response = requests.get(url, headers=self._headers(token), params=params or {})

        if response.status_code != 200:
            self._logger.error(f"Kimai GET {path} failed: {response.status_code} {response.text}")
            raise KimaiClientServiceError(f"Kimai GET {path} failed: {response.text}")

        return response.json()

    def put(self, path: str, token: str, payload: dict) -> dict:
        url = f"{self._base_url}{path}"
        response = requests.patch(url, headers=self._headers(token), json=payload)  # Kimai uses PATCH for updates

        if response.status_code not in (200, 201):
            self._logger.error(f"Kimai PATCH {path} failed: {response.status_code} {response.text}")
            raise KimaiClientServiceError(f"Kimai PATCH {path} failed: {response.text}")

        self._logger.info(f"Kimai PATCH {path} succeeded")
        return response.json()

    def delete(self, path: str, token: str) -> bool:
        url = f"{self._base_url}{path}"
        response = requests.delete(url, headers=self._headers(token))

        if response.status_code not in (200, 204):
            self._logger.error(f"Kimai DELETE {path} failed: {response.status_code} {response.text}")
            raise KimaiClientServiceError(f"Kimai DELETE {path} failed: {response.text}")

        self._logger.info(f"Kimai DELETE {path} succeeded")
        return True