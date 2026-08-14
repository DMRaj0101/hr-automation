"""
Action counter for the four real provisioning connectors (Keycloak,
MailU, Kimai, OpenKM) -- NOT backed by the DB. Two different counts:

  - get_action_counts() / record_action(): an in-memory, live "since
    last boot" tally of real API calls actually made, incremented by
    the connectors themselves (keycloak_connector.py, mailu_connector.py,
    kimai_connector.py, openkm_connector.py) at the point each call
    succeeds. Reads as all-zero until an agent has actually run, and
    resets on process restart.

  - get_static_action_counts(): how many API calls each connector's
    code is WRITTEN to make, counted by statically parsing each
    connector's source file for record_action(...) call sites. Available
    immediately -- before any agent has ever been triggered -- and
    recomputed from source on every call, so it can't drift out of sync
    with the code.

Same self-contained shape as orchestrators/health_check_orchestrator.py's
cache: a module-level dict guarded by a threading.Lock.
"""
from __future__ import annotations

import ast
import threading
from pathlib import Path

AGENT_KEYS = ("keycloak", "mailu", "kimai", "openkm")

_INTEGRATIONS_DIR = Path(__file__).resolve().parent.parent / "integrations"
_CONNECTOR_FILES: dict[str, Path] = {
    "keycloak": _INTEGRATIONS_DIR / "keycloak_connector.py",
    "mailu": _INTEGRATIONS_DIR / "mailu_connector.py",
    "kimai": _INTEGRATIONS_DIR / "kimai_connector.py",
    "openkm": _INTEGRATIONS_DIR / "openkm_connector.py",
}

_lock = threading.Lock()
_counts: dict[str, int] = {key: 0 for key in AGENT_KEYS}


def record_action(agent_key: str) -> None:
    """Increment the action count for one real API call made against
    `agent_key` (one of AGENT_KEYS). Call this once per actual call to
    the downstream system, not once per connector function -- a
    function that makes two real calls should call this twice."""
    if agent_key not in AGENT_KEYS:
        raise ValueError(f"Unknown agent_key '{agent_key}', expected one of {AGENT_KEYS}")
    with _lock:
        _counts[agent_key] += 1


def get_action_counts() -> dict[str, int]:
    """Returns a snapshot {agent_key: count} for all AGENT_KEYS."""
    with _lock:
        return dict(_counts)


def get_total_actions() -> int:
    """Sum of get_action_counts()'s values, for a single overall figure."""
    with _lock:
        return sum(_counts.values())


def _count_record_action_calls(path: Path) -> int:
    """Counts record_action(...) call sites in a connector source file --
    e.g. keycloak_connector.create_user() has one after the user-create
    call and one after the role-assign call, so this returns 2 for that
    file regardless of whether create_user() has ever actually run."""
    tree = ast.parse(path.read_text(encoding="utf-8"))
    return sum(
        1
        for node in ast.walk(tree)
        if isinstance(node, ast.Call)
        and isinstance(node.func, ast.Name)
        and node.func.id == "record_action"
    )


def get_static_action_counts() -> dict[str, int]:
    """Returns {agent_key: count} where count is the number of
    record_action() call sites coded into that agent's connector file --
    available immediately, before any agent has actually been triggered."""
    return {key: _count_record_action_calls(path) for key, path in _CONNECTOR_FILES.items()}

def get_static_agent_action_counts(agent_keys: list[str]) -> dict[str, int]:
    """Returns static action counts for the specified agents."""
    return {
        key: _count_record_action_calls(_CONNECTOR_FILES[key])
        for key in agent_keys
        if key in _CONNECTOR_FILES
    }

def get_static_total_actions() -> int:
    """Sum of get_static_action_counts()'s values."""
    return sum(get_static_action_counts().values())
