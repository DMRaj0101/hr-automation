"""
Loads JSON config files (roles, provisioning matrix, team routing).
Everyone reads config through this module -- don't hardcode role/provisioning
lists anywhere else. Same pattern the previous version used
(config_data/*.json), kept because it's the right shape for the new
role -> provisioning-item mapping too.
"""
import json
import os
from dotenv import load_dotenv

CONFIG_DIR = os.path.join(os.path.dirname(__file__), "config_data")


def _load(filename: str):
    with open(os.path.join(CONFIG_DIR, filename)) as f:
        return json.load(f)


def get_roles() -> dict:
    """department/title hints per role, used by role_classifier.py as the
    fallback classifier when HRMS doesn't send a valid role directly."""
    return _load("roles.json")


def get_provisioning_matrix() -> dict:
    """The PDD Section 3 tables (3.1 Tax, 3.2 Audit, 3.3 Law, 3.4 IT Support),
    structured as: role -> list of provisioning items, each with the
    software name, whether it's Functional (real API call) or Mock
    (ticket only), and a remarks string.

    This is what the Decision Agent (agents/decision_agent.py) reads to
    decide, per employee role, which downstream agent to call for real
    and which items just need a ticket opened."""
    return _load("provisioning_matrix.json")


def get_team_routing() -> dict:
    """PDD Section 4.4 -- which generic team a ticket for a given
    provisioning item routes to (IT / Admin / Security / Facilities / Payroll)."""
    return _load("team_routing.json")
