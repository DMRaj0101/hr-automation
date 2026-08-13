"""
Health Check Orchestrator -- periodic reachability/latency monitoring for
every downstream integration used by the onboarding pipeline (Keycloak,
MailU, Snipe-IT, Kimai, OpenKM, Microsoft 365, GLPI), aggregated into the
shape the frontend's System Health panel expects.

Self-contained by design -- this file is the ONLY change; no existing
connector, router, or main.py is touched:

  - Keycloak, MailU, Kimai, and OpenKM already expose their own
    check_keycloak_latency() / check_mailu_latency() / check_kimai_latency() /
    check_openkm_latency() -- called directly here, unmodified.
  - Snipe-IT doesn't have a check_*_latency() function yet, and
    Microsoft 365 / GLPI have no connector module in this project at
    all. Rather than edit that file (or add two brand-new connector
    modules) just to add one, the equivalent lightweight reachability
    probe is implemented once, locally, as _ping() below -- same
    {"status","status_code","latency_ms","error"} contract as
    check_keycloak_latency() -- and reused for every integration that
    doesn't have its own real check function. Snipe-IT's own URL
    constant (SNIPEIT_URL) is imported and reused rather than
    re-reading the env var under a new name, so there's exactly one
    source of truth for its base URL.

Follows agents/monitoring_agent.py's own "not self-registering" convention:
this module exposes a background loop (health_check_loop()) and a cache
reader (get_cached_health()) rather than triggering itself. main.py's
on_startup() calls asyncio.create_task(health_check_loop()) (same pattern
as monitoring_loop()), and routers/healthcheck.py's GET /system-health
reads the cache via get_cached_health() -- never triggers a live sweep.
"""
from __future__ import annotations

import asyncio
import datetime
import logging
import os
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Callable

import httpx
from app.ai_client import call_ollama_text
from app.database import SessionLocal
from app.integrations import (
    keycloak_connector,
    mailu_connector,
    snipeit_connector,
    kimai_connector,
    openkm_connector,
)
from app.models import AgentHealth

logger = logging.getLogger(__name__)

# How often the background loop refreshes the cache. 5 minutes; overridable
# via env var the same way monitoring_agent.py's MONITORING_POLL_INTERVAL_SECONDS is.
CHECK_INTERVAL_SECONDS = int(os.getenv("SYSTEM_HEALTH_CHECK_INTERVAL_SECONDS", str(5 * 60)))

_TIMEOUT_SECONDS = 10.0
_DEGRADED_THRESHOLD_MS = 1000  # UP but >= this many ms -> "Degraded", not "Operational"

# Microsoft 365 and GLPI have no connector module in this project (see
# module docstring) -- their base URLs are read directly here, same
# missing-env-var-is-DOWN convention every other integration below uses.
MICROSOFT365_HEALTH_URL = os.getenv("MICROSOFT365_HEALTH_URL", "")
GLPI_URL = os.getenv("GLPI_URL", "")


def _ping(url: str) -> dict:
    """
    Generic reachability probe, identical contract to
    keycloak_connector.check_keycloak_latency(): a plain GET against the
    given base URL, UP only on a 200, DOWN (with latency/error filled in)
    on anything else -- never raises. Used for every integration that
    doesn't have its own real check_*_latency() function (see module
    docstring).
    """
    if not url:
        return {
            "status": "DOWN",
            "status_code": None,
            "latency_ms": 0.0,
            "error": "Integration base URL is not configured",
        }

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


# Frontend display name -> zero-arg callable returning the
# {"status","status_code","latency_ms","error"} contract. Keycloak's is
# the connector's own real check; the rest fall back to _ping() against
# each connector's already-configured base URL (see module docstring).
_HEALTH_CHECKS: list[tuple[str, Callable[[], dict]]] = [
    ("Keycloak", keycloak_connector.check_keycloak_latency),
    ("MailU", mailu_connector.check_mailu_latency),
    ("Snipe-IT", lambda: _ping(snipeit_connector.SNIPEIT_URL)),
    ("Kimai", kimai_connector.check_kimai_latency),
    ("OpenKM", openkm_connector.check_openkm_latency),
    ("Microsoft 365", lambda: _ping(MICROSOFT365_HEALTH_URL)),
    ("GLPI", lambda: _ping(GLPI_URL)),
]


def _to_frontend_status(result: dict) -> dict:
    """
    Maps one connector-style result into the frontend's
    {"status","latency"} shape, per the fixed rule:
      - connector status != UP     -> "Down", latency "Timeout"
      - UP and latency_ms < 1000   -> "Operational"
      - UP and latency_ms >= 1000  -> "Degraded"
    Nothing here is hardcoded per-integration -- purely a function of the
    connector's own reported status/latency.
    """
    if result.get("status") != "UP":
        return {"status": "Down", "latency": "Timeout"}

    latency_ms = result.get("latency_ms") or 0.0
    status = "Operational" if latency_ms < _DEGRADED_THRESHOLD_MS else "Degraded"
    return {"status": status, "latency": f"{latency_ms:.0f}ms"}


def _run_single_check(name: str, check_fn: Callable[[], dict]) -> dict:
    """
    Runs one integration's check function, translating any exception it
    raises (the documented contract is that these never raise, but a
    reused connector -- e.g. one whose _auth()/_require_env() path raises
    on missing credentials -- must not take down the whole sweep) into
    the same DOWN shape _ping() would have returned. Failures are logged,
    not swallowed silently, per the "log failures but continue checking
    remaining integrations" requirement.
    """
    try:
        result = check_fn()
    except Exception as exc:
        logger.error("Health check failed for %s: %s", name, exc)
        result = {"status": "DOWN", "status_code": None, "latency_ms": 0.0, "error": str(exc)}

    # latency_ms and error carry the raw check_fn() readings through to
    # _persist_health() below -- the frontend-facing "latency" key from
    # _to_frontend_status() is a formatted string ("123ms" / "Timeout"),
    # not usable for the AgentHealth.latency_ms/context columns.
    return {
        "name": name,
        "latency_ms": result.get("latency_ms"),
        "error": result.get("error"),
        **_to_frontend_status(result),
    }


def run_health_checks() -> dict:
    """
    Runs every integration's health check concurrently -- a
    ThreadPoolExecutor, since check_keycloak_latency()/_ping() are plain
    blocking httpx calls (consistent with every connector in this
    project, all sync) -- so the slowest integration's own
    _TIMEOUT_SECONDS bounds the whole sweep instead of the sum of all
    seven. Returns the consolidated frontend payload directly; does not
    touch the cache (see refresh_health_cache() for that).
    """
    with ThreadPoolExecutor(max_workers=len(_HEALTH_CHECKS)) as pool:
        futures = [pool.submit(_run_single_check, name, fn) for name, fn in _HEALTH_CHECKS]
        details = [future.result() for future in futures]

    return {"systemHealthDetail": details}


# ----------------------------------------------------------------------
# Cache -- an API layer must only ever read this, never trigger a live
# sweep (see module docstring's TODO #2).
# ----------------------------------------------------------------------

_cache_lock = threading.Lock()
_cached_result: dict | None = None


def get_cached_health() -> dict:
    """
    Returns the latest cached sweep without running a new one.
    """
    with _cache_lock:
        if _cached_result is None:
            return {"systemHealthDetail": []}

        result = _cached_result.copy()

    for item in result.get("systemHealthDetail", []):
        error = item.get("error")

        # No error means the system is healthy
        if not error or not str(error).strip():
            item["error"] = "The system is healthy and operating normally."
            continue

        prompt = f"""
Convert this system health error into ONE short, professional,
business-friendly error message that a non-technical person can understand.

System: {item.get("name")}
Status: {item.get("status")}
Error: {error}

Rules:
- Use both the Status and Error to understand the problem.
- Return exactly ONE sentence.
- Keep it under 20 words.
- Use simple business language.
- Do not mention APIs, code, environment variables, ports,
  stack traces, localhost, or technical implementation details.
- Do not give troubleshooting instructions.
- Do not use a generic message such as "An unexpected error occurred".
- Do not invent information.
- Return ONLY the business error message.

Business Error:
"""
        context = call_ollama_text(prompt)
        item["error"] = context

    return result
def _persist_health(details: list[dict]) -> None:
    """
    Inserts one new AgentHealth row per integration per sweep -- an
    append-only history log (not an upsert-in-place snapshot), so
    routers/healthcheck.py can read back each agent's last-24h latency
    trend and uptime percentage. DB failures are logged and swallowed
    here, same as _run_single_check's per-integration isolation: a
    persistence error must not stop the cache from being refreshed by
    the caller.
    """
    db = SessionLocal()
    try:
        now = datetime.datetime.utcnow()
        for detail in details:
            db.add(AgentHealth(
                agent=detail["name"],
                status=detail.get("status"),
                latency_ms=detail.get("latency_ms"),
                last_heartbeat=now,
                context=detail.get("error"),
            ))
        db.commit()
    except Exception as exc:
        logger.error("Failed to persist health sweep to AgentHealth table: %s", exc)
        db.rollback()
    finally:
        db.close()


def refresh_health_cache() -> dict:
    """Runs a fresh sweep, stores it as the new cached result, and
    persists each integration's latest status/latency to the AgentHealth
    table. Called by health_check_loop() every CHECK_INTERVAL_SECONDS;
    also safe to call directly (e.g. a manual-refresh admin action) if
    ever needed."""
    global _cached_result
    result = run_health_checks()
    with _cache_lock:
        _cached_result = result
    _persist_health(result["systemHealthDetail"])
    return result


async def health_check_loop():
    """
    Background loop: refreshes the cached health sweep every
    CHECK_INTERVAL_SECONDS (default 30 minutes). Same
    asyncio.create_task()-from-main.py's-on_startup() convention as
    agents/monitoring_agent.py's monitoring_loop() -- deliberately NOT
    self-registering, so main.py stays the single place background tasks
    are wired up (see this file's TODO below).

    Unlike monitoring_loop() (which sleeps first), this runs an initial
    sweep immediately so the cache isn't empty for the first 30 minutes
    after the backend starts. The blocking sweep itself runs via
    asyncio.to_thread() so it never stalls the FastAPI event loop while
    waiting on network I/O.
    """
    while True:
        try:
            await asyncio.to_thread(refresh_health_cache)
        except Exception as exc:
            logger.error("[HEALTH CHECK ORCHESTRATOR] Sweep failed: %s", exc)
        await asyncio.sleep(CHECK_INTERVAL_SECONDS)
