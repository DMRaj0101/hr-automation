"""
Owns the onboarding step sequence -- PDD Section 1's 6 steps:
1. HR creates/updates employee in Mock HRMS (see routers/hrms_sync.py,
   integrations/hrms_connector.py -- both already wired, this file
   starts at step 2).
2. AI Orchestrator receives the event -- run_onboarding() below.
3. Decision Agent identifies which downstream systems to provision.
4. Individual downstream agents perform the required actions.
5. Monitoring Agent tracks progress (see agents/monitoring_agent.py).
6. Knowledge Agent answers status queries (see routers/hr_assistant.py
   + the live-data routing TODO there).

This keeps the previous version's proven scaffolding shape (_mark(),
_audit(), a STEPS list, a duplicate-run guard) but the middle of the
pipeline is now: role resolution -> Decision Agent -> real connector
calls for Functional items (each behind a TODO until its connector is
implemented) -> Ticket Generation Agent for Mock items -> welcome email.

PDD Suggestion #1 (Section 11) is still open: whether provisioning
happens automatically right after the Decision Agent runs, or waits
for an approval step first. This file assumes "automatic" for now
(no pause) -- see MIGRATION_NOTES.md. If that decision changes, the
pause point is between STEP_DECISION and STEP_PROVISIONING below.
"""
import datetime
from sqlalchemy.orm import Session
from app.models import Employee, OnboardingTracker, AuditLog, ProvisioningRecord, RoleClassification
from app.agents.role_classifier import classify_role
from app.agents.decision_agent import decide
from app.agents import ticket_agent
from app.integrations import keycloak_connector, mailu_connector, kimai_connector, snipeit_connector, openkm_connector
from app import email_client
from app.models import WelcomeEmail

STEP_REGISTERED = "Registered"
STEP_ROLE_RESOLUTION = "Role Resolution"
STEP_DECISION = "Decision Agent"
STEP_PROVISIONING = "Provisioning"
STEP_TICKETING = "Ticketing"
STEP_MONITORING = "Monitoring"

STEPS = [
    STEP_REGISTERED, STEP_ROLE_RESOLUTION, STEP_DECISION,
    STEP_PROVISIONING, STEP_TICKETING, STEP_MONITORING,
]

# agent_key -> connector function. TODO: each of these currently raises
# NotImplementedError -- see the matching integrations/*_connector.py
# file. Wired here (rather than inline below) so adding a connector is
# a one-line change once it's implemented.
_PROVISIONING_CALLS = {
    "identity": lambda emp: keycloak_connector.create_user(emp.name, emp.email, emp.role),
    "email": lambda emp: mailu_connector.create_mailbox(emp.name, emp.email.split("@")[0]),
    "time_billing": lambda emp: kimai_connector.create_user_and_timesheet(emp.name, emp.email, emp.role),
    "asset": lambda emp: snipeit_connector.allocate_standard_kit(emp.name, emp.email),
    "document_management": lambda emp: openkm_connector.create_workspace(emp.name, emp.email, emp.role),
}


def _mark(db: Session, employee_id: str, step: str, status: str, detail: str = None):
    db.add(OnboardingTracker(employee_id=employee_id, step=step, status=status, detail=detail))
    db.commit()


def _audit(db: Session, employee_id: str, agent: str, action: str, detail: str = ""):
    db.add(AuditLog(employee_id=employee_id, agent=agent, action=action, detail=detail))
    db.commit()


def _resolve_role(db: Session, employee: Employee) -> str:
    """HRMS role is source of truth; AI classifier is FALLBACK ONLY --
    same rule the previous version used, unchanged."""
    if employee.role:
        return employee.role

    result = classify_role(employee.department, employee.title, employee.office)
    db.add(RoleClassification(
        employee_id=employee.id, predicted_role=result["role"],
        confidence=result.get("confidence", 0.0), reasoning=result.get("reasoning"),
    ))
    employee.role = result["role"]
    db.commit()
    _audit(db, employee.id, "Role Classifier", f"Classified as {result['role']}", result.get("reasoning", ""))
    return employee.role


def _draft_and_queue_welcome_email(db: Session, employee: Employee):
    """Kept from the previous version, unchanged -- PDD Section 6.2's I1
    ("Onboarding request received" -> HR/Manager) and I2 ("Mailbox
    created" -> new employee welcome email) both live here conceptually;
    this drafts the I2-style welcome email. TODO: once
    mailu_connector.create_mailbox() is implemented and returns a temp
    password, thread it into this draft (see mailu_connector.py's
    module docstring point 5)."""
    existing = db.query(WelcomeEmail).filter(WelcomeEmail.employee_id == employee.id).first()
    if existing:
        return
    # TODO: this previously called an AI agent (welcome_email_agent.py,
    # removed) to draft subject/body. Either restore a similar draft
    # agent, or -- simpler, given this is a fixed-shape notification --
    # just template it directly. Left as a plain placeholder for now:
    subject = f"Welcome to the team, {employee.name}!"
    body = f"Hi {employee.name},\n\nWelcome aboard! Your onboarding is underway.\n\nTODO: fill in login instructions once mailu_connector.create_mailbox() is implemented."
    db.add(WelcomeEmail(employee_id=employee.id, subject=subject, body=body, status="drafted"))
    db.commit()
    _audit(db, employee.id, "Email Agent", "Welcome email drafted", "")


def run_onboarding(db: Session, employee_id: str) -> dict:
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise ValueError(f"Employee {employee_id} not found")

    if employee.status != "registered":
        return {
            "status": employee.status,
            "note": "Onboarding already in progress or further along -- no action taken to avoid duplicating tickets/provisioning.",
        }

    _mark(db, employee_id, STEP_REGISTERED, "completed")

    # --- Step 3: Role Resolution + Decision Agent ---
    _mark(db, employee_id, STEP_ROLE_RESOLUTION, "running")
    role = _resolve_role(db, employee)
    _mark(db, employee_id, STEP_ROLE_RESOLUTION, "completed", detail=f"Role: {role}")

    _mark(db, employee_id, STEP_DECISION, "running")
    try:
        plan = decide(role)
    except KeyError as e:
        _mark(db, employee_id, STEP_DECISION, "failed", detail=str(e))
        _audit(db, employee_id, "Decision Agent", "No provisioning matrix for role", str(e))
        return {"status": "failed", "reason": str(e)}
    _mark(db, employee_id, STEP_DECISION, "completed",
          detail=f"{len(plan['functional_items'])} functional item(s), {len(plan['mock_items'])} mock item(s)")
    _audit(db, employee_id, "Decision Agent", "Provisioning plan decided",
           f"Functional: {[i['item'] for i in plan['functional_items']]}; Mock: {[i['item'] for i in plan['mock_items']]}")

    employee.status = "provisioning"
    db.commit()

    # TODO (PDD Suggestion #1, still open): if the team decides provisioning
    # should wait for a human approval of this plan before proceeding,
    # this is the pause point -- stop here, create a single approval
    # record for the plan, and have a separate endpoint resume the rest
    # of this function. See MIGRATION_NOTES.md.

    _draft_and_queue_welcome_email(db, employee)

    # --- Step 4: Downstream agents perform real provisioning ---
    _mark(db, employee_id, STEP_PROVISIONING, "running")
    for item in plan["functional_items"]:
        record = ProvisioningRecord(
            employee_id=employee_id, provisioning_item=item["item"],
            agent_key=item["agent_key"], software_name=item["software_name"],
            status="in_progress", last_attempted_at=datetime.datetime.utcnow(),
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        call = _PROVISIONING_CALLS.get(item["agent_key"])
        try:
            result = call(employee)  # TODO: raises NotImplementedError until each connector is built
            record.status = "completed"
            record.external_ref = result.get("external_ref")
            record.completed_at = datetime.datetime.utcnow()
            db.commit()
            _audit(db, employee_id, f"{item['agent_key'].title()} Agent",
                   f"Provisioned {item['item']}", result.get("detail", ""))
        except NotImplementedError as e:
            # Expected until the connector is built -- log clearly rather
            # than silently failing, so it's obvious in the audit trail
            # which items are still pending implementation vs. genuinely
            # failed at runtime.
            record.status = "not_started"
            record.error_detail = f"Connector not yet implemented: {e}"
            db.commit()
            _audit(db, employee_id, f"{item['agent_key'].title()} Agent",
                   f"Skipped {item['item']} -- connector not implemented", str(e))
        except Exception as e:
            record.status = "failed"
            record.retry_count += 1
            record.error_detail = str(e)
            db.commit()
            _audit(db, employee_id, f"{item['agent_key'].title()} Agent",
                   f"Failed {item['item']}", str(e))
            # TODO: Monitoring Agent picks this up on its next poll and
            # continues retrying per PDD Section 5 -- no further action
            # needed here.
    _mark(db, employee_id, STEP_PROVISIONING, "completed")

    # --- Ticket Generation Agent for Mock items ---
    _mark(db, employee_id, STEP_TICKETING, "running")
    for mock_item in plan["mock_items"]:
        ticket_agent.create_ticket(db, employee_id, role, mock_item)
    _mark(db, employee_id, STEP_TICKETING, "completed",
          detail=f"{len(plan['mock_items'])} ticket(s) created")

    # --- Hand off to Monitoring Agent (background loop, not called directly here) ---
    _mark(db, employee_id, STEP_MONITORING, "running")
    _audit(db, employee_id, "Monitoring Agent",
           "Handed off for ongoing polling", "See agents/monitoring_agent.py")

    return {
        "status": "provisioning",
        "role": role,
        "functional_items": len(plan["functional_items"]),
        "mock_items": len(plan["mock_items"]),
    }

