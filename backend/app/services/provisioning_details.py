"""
Resolves "what did this provisioning item actually grant?" from
config_data/mock_provisioning_details.json.

Two consumers, which is why this lives in services/ rather than inside
integrations/mock_connector.py:
  - integrations/mock_connector.py, for the detail sentence it returns
    (which ends up as AgentTicket.content, i.e. the `note` field).
  - routers/onboardingDetails.py, for the provided[] list on each
    Provisional Status row.

A router importing an integrations/ connector would be the wrong
dependency direction, hence the shared module.

provided[] is re-derived here on every read instead of being persisted.
That is deliberate: the project has no Alembic (main.py only calls
Base.metadata.create_all(), which never adds columns to an existing
table), so persisting it would mean a hand-written ALTER TABLE on every
environment. The consequence to be aware of: editing the JSON changes
what ALREADY-provisioned rows report, because there is no historical
snapshot. Acceptable for POC/demo; this is not an audit trail (the
AuditLog is).
"""
from functools import lru_cache

from app.config import get_mock_provisioning_details


class _SafeDict(dict):
    """Leaves unknown placeholders as literal "{key}" instead of raising.

    A KeyError here would abort a provisioning run over a typo'd
    placeholder in a config file, which is a bad trade -- a visibly
    unrendered "{foo}" in the detail line is far easier to notice and fix
    than a failed onboarding.
    """

    def __missing__(self, key):
        return "{" + key + "}"


@lru_cache(maxsize=1)
def _details() -> dict:
    """Cached, unlike config.get_provisioning_matrix() -- resolve() is
    called once per row on a read endpoint, so re-reading the file each
    time would mean file I/O inside a render loop. Trade-off: edits to
    mock_provisioning_details.json need a backend restart to take effect.
    """
    return get_mock_provisioning_details()


def resolve(agent_key: str, item: str = None, department: str = None) -> dict:
    """Merged config entry for one provisioning item:
    {"provided": [...], "template": str | None}.

    Merge order is base -> by_department[department] -> by_item[item],
    each tier free to replace either key -- so a tier that overrides only
    `provided` keeps the base `template`.

    Returns empty defaults for an unknown agent_key rather than raising: a
    new mock item added to provisioning_matrix.json without a matching
    entry here should degrade to an empty provided[] list, not break
    provisioning.
    """
    entry = _details().get(agent_key) or {}

    merged = {
        "provided": entry.get("provided", []),
        "template": entry.get("template"),
    }

    for tier, key in (("by_department", department), ("by_item", item)):
        override = (entry.get(tier) or {}).get(key) if key else None
        if not override:
            continue
        if "provided" in override:
            merged["provided"] = override["provided"]
        if "template" in override:
            merged["template"] = override["template"]

    return merged


def provided_for(agent_key: str, item: str = None, department: str = None, **fmt) -> list[str]:
    """The formatted list of things this item granted, e.g.
    ["Laptop", "Dual Monitor", ...]. Empty list when nothing is configured
    for this agent_key.

    `fmt` supplies the placeholder values ({employee_name}, {external_ref},
    ...); anything not supplied renders as its literal "{key}".
    """
    values = _SafeDict(item=item or "", department=department or "", **fmt)
    return [entry.format_map(values) for entry in resolve(agent_key, item, department)["provided"]]


def render_detail(agent_key: str, item: str = None, department: str = None, **fmt) -> str | None:
    """The human-readable detail sentence for one provisioning item, or
    None when this agent_key has no `template` configured -- which is the
    case for every functional item on purpose, since their sentence comes
    from the connector that holds the real identifier. Callers are
    expected to have their own fallback for None.

    {provided} in the template renders as the comma-joined provided_for()
    list, so a template never has to repeat the item names.
    """
    entry = resolve(agent_key, item, department)
    if not entry["template"]:
        return None

    provided = provided_for(agent_key, item, department, **fmt)
    values = _SafeDict(
        item=item or "", department=department or "",
        provided=", ".join(provided), **fmt,
    )
    return entry["template"].format_map(values)
