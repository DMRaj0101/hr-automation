"""
Decision Agent -- PDD Section 2.1, Step 3: "identifies which downstream
systems need to be provisioned based on the employee's role."

This part is genuinely just a config lookup (rule-based selection per
Section 2.1's table), so it's implemented fully below -- no TODO needed
here. What's NOT implemented here, by design, is actually calling the
downstream agents/connectors: that happens in the orchestrator
(orchestrators/onboarding_orchestrator.py), which reads this agent's
output and dispatches each functional item to the right connector.

If this needs to become AI-driven later (e.g. role isn't a clean match
to the provisioning_matrix.json keys), swap `decide` below to call
ai_client.call_ollama_json with a fallback to this same rule-based path
-- same pattern as agents/role_classifier.py.
"""
from app.config import get_provisioning_matrix, get_team_routing


def decide(department: str) -> dict:
    """Returns the full provisioning plan for a department:
    {
      "role": "Tax",
      "functional_items": [ {item, software_name, agent_key, scoped_role}, ... ],
      "mock_items": [ {item, software_name, assigned_team, remarks}, ... ],
    }

    scoped_role: passed through as-is from provisioning_matrix.json
    (defaults to False if absent). Currently only meaningful for
    Keycloak's "identity" agent_key, which uses it to distinguish IT
    Support's "Helpdesk Admin Role (scoped)" item from the regular
    "Identity Account Creation" item -- see
    orchestrators/onboarding_orchestrator.py's _PROVISIONING_CALLS for
    where it's consumed. Every other agent_key just ignores it.

    Raises KeyError if the role isn't in provisioning_matrix.json --
    callers (the orchestrator) should treat that as a hard stop and
    flag for manual role assignment, not silently skip provisioning.
    """
    matrix = get_provisioning_matrix()
    team_routing = get_team_routing()

    if department not in matrix:
        raise KeyError(f"No provisioning matrix entry for department '{department}'")

    functional_items = []
    mock_items = []

    for entry in matrix[department]:
        if entry["status"] == "functional":
            functional_items.append({
                "item": entry["item"],
                "software_name": entry["software"],
                "agent_key": entry["agent_key"],
                "scoped_role": entry.get("scoped_role", False),
            })
        else:
            mock_items.append({
                "item": entry["item"],
                "software_name": entry["software"],
                "assigned_team": team_routing.get(entry["item"], "IT"),
                "remarks": entry.get("remarks", ""),
            })

    return {"role": department, "functional_items": functional_items, "mock_items": mock_items}
