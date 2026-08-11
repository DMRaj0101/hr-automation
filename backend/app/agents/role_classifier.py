"""
Classifies an employee into one of the predefined roles.
Falls back to a simple department keyword match if Ollama is unavailable.
"""
import json
from app.ai_client import call_ollama_json, OllamaError
from app.config import get_roles

PROMPT_TEMPLATE = """You are an HR role classification assistant.
Given this employee's department, classify them into exactly one
of these roles: {roles}.

Employee:
department: {department}
office: {office}

Respond ONLY with JSON in this exact shape, no other text:
{{"role": "<one of the roles above>", "confidence": <float 0-1>, "reasoning": "<one sentence>"}}
"""


def _rule_based_fallback(department: str, roles_config: dict) -> dict:
    department = (department or "").lower()
    for role, hints in roles_config.items():
        dept_hints = [h.lower() for h in hints.get("department_hints", [])]
        if any(h in department for h in dept_hints):
            return {
                "department": role,
                "confidence": 0.6,
                "reasoning": f"Rule-based fallback match on department keywords (Ollama unavailable).",
            }
    # TODO: "Law" is an arbitrary default for a department that matches
    # none of the four roles (e.g. Marketing, HR) -- fine for
    # demonstrating the fallback path in the mock HRMS fixture data,
    # but worth a real decision once real HRMS data includes
    # departments outside Tax/Audit/Law/IT Support.
    return {"department": "Law", "confidence": 0.3, "reasoning": "No match found; defaulted (Ollama unavailable)."}


def classify_role(department: str, office: str) -> dict:
    roles_config = get_roles()
    prompt = PROMPT_TEMPLATE.format(
        roles=", ".join(roles_config.keys()),
        department=department, office=office or "",
    )
    try:
        result = call_ollama_json(prompt)
        if result.get("department") not in roles_config:
            raise OllamaError("model returned a department outside the allowed list")
        return result
    except OllamaError:
        return _rule_based_fallback(department, roles_config)
