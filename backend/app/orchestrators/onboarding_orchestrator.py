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
from app import database
import datetime
from sqlalchemy.orm import Session
from app.models import Employee, OnboardingTracker, AuditLog, ProvisioningRecord, RoleClassification
from app.agents.role_classifier import classify_role
from app.agents.decision_agent import decide
from app.agents import ticket_agent
from app.integrations import keycloak_connector, mailu_connector, kimai_connector, snipeit_connector, openkm_connector, hrms_connector, mock_connector
from app.services.agent_ticketing_service import AgentTicketClient
from app.services.onboarding_status import mark_active_if_onboarding_complete
from app.services.credential_store import store_credential
from app import email_client
from app.models import WelcomeEmail
from dotenv import load_dotenv

load_dotenv()
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

# agent_key -> connector function. TODO: Snipe-IT still raises
# NotImplementedError -- see integrations/snipeit_connector.py. Wired
# here (rather than inline below) so adding a connector is a one-line
# change once it's implemented.
#
# Keycloak (identity), MailU (email), and Kimai (time_billing) are real
# implementations.
# Lambdas take (emp, item) instead of just (emp) -- needed to fix a
# real dispatch bug: IT Support has TWO separate "identity" provisioning
# items (regular account + scoped Helpdesk Admin role), and the
# dispatch table previously had no way to tell them apart by agent_key
# alone -- both calls would have used scoped_role=False, so the second
# call would fail (duplicate Keycloak user) and the scoped role would
# never get assigned. Fixed by reading a `scoped_role` flag off the
# item itself (see config_data/provisioning_matrix.json and
# agents/decision_agent.py, both updated to carry it through).
_PROVISIONING_CALLS = {
    "identity": lambda emp, item: keycloak_connector.create_user(
        emp.name, emp.email, emp.department, scoped_role=item.get("scoped_role", False)
    ),
    "email": lambda emp, item: mailu_connector.create_mailbox(emp.name, emp.email.split("@")[0]),
    "time_billing": lambda emp, item: kimai_connector.create_user_and_timesheet(emp.name, emp.email, emp.role),
    # "asset": lambda emp, item: snipeit_connector.allocate_standard_kit(emp.name, emp.email),
    "document_management": lambda emp, item: openkm_connector.create_workspace(emp.name, emp.email, emp.role),
}

# Display names for audit-log entries -- matches the PDD's own naming
# exactly. Previously generated with agent_key.title() + " Agent", which
# silently produced wrong names for anything with an underscore (e.g.
# "Time_Billing Agent" instead of "Time & Billing Agent",
# "Document_Management Agent" instead of "Document Management Agent").
AGENT_DISPLAY_NAMES = {
    "identity": "Identity Agent",
    "email": "Email Agent",
    "time_billing": "Time & Billing Agent",
    "document_management": "Document Management Agent",
    # -- mock items with a real agent_key (added):
    "asset": "Asset Allocation Agent",
    "access_recommendation": "Access Recommendation Agent",
    "tax_preparation": "Tax Preparation Agent",
    "productivity_suite": "Productivity Suite Agent",
    "network_access": "Network Access Agent",
    "ticketing_itsm": "Ticketing/ITSM Agent",
    "audit_software": "Audit Software Agent",
    "legal_research": "Legal Research Agent",
    "ticketing_fulfiller_role": "Ticketing (Fulfiller role) Agent",
    "remote_support_tool": "Remote Support Tool Agent",
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
    if not employee.department:
        return employee.department

    result = classify_role(employee.department, employee.office)
    db.add(RoleClassification(
        employee_id=employee.id, predicted_role=result["department"],
        confidence=result.get("confidence", 0.0), reasoning=result.get("reasoning"),
    ))
    employee.department = result["department"]
    db.commit()
    _audit(db, employee.id, "Role Classifier", f"Classified as {result['department']}", result.get("reasoning", ""))
    return employee.department


def _draft_and_queue_welcome_email(db: Session, employee: Employee, credentials: list[dict]):
    """PDD Section 6.2's I1 ("Onboarding request received" -> HR/Manager)
    and I2 ("Mailbox created" -> new employee welcome email) both live
    here conceptually; this drafts the I2-style welcome email.

    `credentials` is a list of {"system", "username", "password"} dicts
    collected during provisioning (see the functional-items loop below)
    -- currently populated by openkm_connector.create_workspace()'s
    `openkm_username`/`temp_password` fields when a new OpenKM account
    was created, and will be populated by mailu_connector.create_mailbox()
    the same way once that connector is implemented.

    SECURITY NOTE (flagging, not fixing here -- a product decision):
    this writes temp passwords in plaintext into WelcomeEmail.body,
    which then sits in the database and gets sent over
    email_client.py's SMTP connection. That's a common-enough pattern
    for temp/first-login passwords but not a best-practice one -- a
    reset-link flow (employee sets their own password on first login)
    would avoid ever having a real password at rest or in an email body
    at all. Worth a real decision before this goes past POC/demo use,
    not something this function should quietly decide on its own.
    """
    existing = db.query(WelcomeEmail).filter(WelcomeEmail.employee_id == employee.id).first()
    if existing:
        return
    # TODO: this previously called an AI agent (welcome_email_agent.py,
    # removed) to draft subject/body. Either restore a similar draft
    # agent, or -- simpler, given this is a fixed-shape notification --
    # just template it directly. Left as a plain placeholder for now.
    subject = f"Welcome to the team, {employee.name}!"
    body = f"Hi {employee.name},\n\nWelcome aboard! Your onboarding is underway.\n"
    if credentials:
        body += "\nYour initial login credentials:\n"
        for cred in credentials:
            body += f"  - {cred['system']}: username '{cred['username']}', temporary password '{cred['password']}'\n"
        body += "\nPlease log in and change these passwords as soon as possible.\n"
    else:
        body += "\nTODO: no login credentials were available yet when this was drafted -- either no Functional items generated one, or this ran before provisioning finished."
    db.add(WelcomeEmail(employee_id=employee.id, subject=subject, body=body, status="drafted"))
    db.commit()
    _audit(db, employee.id, "Email Agent", "Welcome email drafted", f"{len(credentials)} credential(s) included")


def _seed_openkm_documents(employee: Employee, folder_path: str) -> str:
    """Fetches the employee's onboarding documents from the mock HRMS
    and uploads them into their newly-created OpenKM folder. Best-effort
    and non-fatal by design -- see openkm_connector.upload_employee_documents()'s
    docstring: one bad file shouldn't undo an otherwise-successful
    workspace creation. Returns a short summary string for the audit log.

    Sensitive documents (SSN scans, bank details) are excluded by
    default -- see integrations/hrms_connector.py's
    SENSITIVE_DOCUMENT_MARKERS and its TODO; this is a judgment call
    flagged for whoever owns document-retention policy, not something
    decided quietly here.
    """
    try:
        filenames = hrms_connector.list_employee_documents(employee.employee_id)
    except Exception as e:
        return f"Could not list documents from mock HRMS: {e}"

    if not filenames:
        return "No documents available to seed."

    documents = []
    for filename in filenames:
        try:
            content = hrms_connector.get_employee_document(employee.employee_id, filename)
            documents.append((filename, content))
        except Exception as e:
            documents.append((filename, None))  # will show up as a fetch failure below, not silently dropped

    to_upload = [(f, c) for f, c in documents if c is not None]
    fetch_failures = [f for f, c in documents if c is None]

    results = openkm_connector.upload_employee_documents(folder_path, to_upload)
    ok = [r for r in results if r["error"] is None]
    failed = [r for r in results if r["error"] is not None]

    summary = f"Uploaded {len(ok)}/{len(filenames)} document(s)."
    if fetch_failures:
        summary += f" Failed to fetch from mock HRMS: {fetch_failures}."
    if failed:
        summary += f" Failed to upload: {[(r['filename'], r['error']) for r in failed]}."
    return summary


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
    department = _resolve_role(db, employee)
    _mark(db, employee_id, STEP_ROLE_RESOLUTION, "completed", detail=f"Role: {department}")

    _mark(db, employee_id, STEP_DECISION, "running")
    try:
        plan = decide(department)
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

    # NOTE: welcome email is drafted AFTER provisioning below, not here --
    # it needs to include any real login credentials (e.g. OpenKM's
    # temp password) that provisioning generates. See the functional-items
    # loop and _draft_and_queue_welcome_email()'s docstring.

    # --- Step 4: Downstream agents perform real provisioning ---
    _mark(db, employee_id, STEP_PROVISIONING, "running")
    credentials = []  # collected from connector results below, threaded into the welcome email after this loop
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
        agent_display_name = AGENT_DISPLAY_NAMES.get(item["agent_key"], item["agent_key"])
        # AgentTicketClient -- the AI-only execution-log ticket, distinct
        # from the human-facing Ticket (Section 4). Fires the moment each
        # agent starts, and resolves to either completed or problem below.
        # This is what backs the "native ticket queue" showing live
        # agent-run status in the frontend -- previously built but never
        # actually called from inside an agent (see MIGRATION_NOTES.md).
        agent_ticket = AgentTicketClient(agent_name=agent_display_name, employee_id=employee.employee_id)
        agent_ticket.report_started()
        try:
            result = call(employee, item)  # TODO: raises NotImplementedError until Kimai/Snipe-IT are built
            record.status = "completed"
            record.external_ref = result.get("external_ref")
            # Same per-connector key-name fallback as the credentials
            # capture below (openkm_connector -> "openkm_username",
            # keycloak/kimai connectors -> "username", mailu_connector ->
            # "email_address") -- confirmed by checking each connector's
            # actual return value, not assumed. None (not employee.email)
            # when a connector doesn't return one, so this column
            # accurately reflects what the connector actually reported.
            record.username = (
                result.get("openkm_username")
                or result.get("username")
                or result.get("email_address")
            )
            record.completed_at = datetime.datetime.utcnow()
            db.commit()
            # The connector's own detail sentence becomes the agent ticket's
            # content, which routers/onboardingDetails.py returns as this
            # row's `note` -- so the screen says "Identity account created
            # for John Doe... Keycloak user ID: ..." instead of the generic
            # "Agent 'Identity Agent' completed processing successfully."
            agent_ticket.report_completed(detail=result.get("detail"))
            _audit(db, employee_id, agent_display_name,
                   f"Provisioned {item['item']}", result.get("detail", ""))
            # Capture any freshly-issued login credentials. Each connector
            # uses a different key name for the password, confirmed by
            # checking their actual return values (not assumed):
            #   - openkm_connector.create_workspace()         -> "temp_password"
            #   - mailu_connector.create_mailbox()            -> "temp_password"
            #   - kimai_connector.create_user_and_timesheet() -> "temp_password"
            #   - keycloak_connector.create_user()            -> "password" (NOT "temp_password")
            # Missing/None whenever nothing new was issued (e.g. a reused
            # OpenKM or Kimai account).
            password_value = result.get("temp_password") or result.get("password")
            credential_system = item["software_name"] or item["agent_key"]
            credential_username = (
                result.get("openkm_username")
                or result.get("email_address")
                or result.get("username")
                or employee.email
            )
            # Persist to the credential store -- one row per successful
            # functional item, INCLUDING the reused-account case where no
            # new password was issued, so the provisional-status screen has
            # an entry for every provisioned application rather than only
            # the freshly-issued ones. Uses this same `db`, so the row
            # lands in the same transaction as the ProvisioningRecord it
            # points at. See services/credential_store.py.
            store_credential(
                db, employee_id,
                system=credential_system,
                agent_key=item["agent_key"],
                username=credential_username,
                password=password_value,
                provisioning_record_id=record.id,
                external_ref=result.get("external_ref"),
            )
            # The welcome email can only print credentials that exist, so
            # unlike the store above this stays gated on a real password --
            # a reused account has nothing new to tell the new hire.
            if password_value:
                credentials.append({
                    "system": credential_system,
                    "username": credential_username,
                    "password": password_value,
                })
            # Seed the new OpenKM workspace with the employee's onboarding
            # documents (offer letter, resume, etc.) -- see
            # _seed_openkm_documents()'s docstring. Only applies to the
            # document_management item; other functional items have no
            # equivalent step.
            if item["agent_key"] == "document_management" and result.get("folder_path"):
                seed_summary = _seed_openkm_documents(employee, result["folder_path"])
                _audit(db, employee_id, AGENT_DISPLAY_NAMES["document_management"], "Seeded documents", seed_summary)
        except NotImplementedError as e:
            # Expected until the connector is built -- log clearly rather
            # than silently failing, so it's obvious in the audit trail
            # which items are still pending implementation vs. genuinely
            # failed at runtime. Still reported as a problem on the agent
            # ticket -- from the AI-monitoring perspective this attempt
            # didn't complete either way, regardless of cause.
            record.status = "not_started"
            record.error_detail = f"Connector not yet implemented: {e}"
            db.commit()
            agent_ticket.report_problem(f"Connector not yet implemented: {e}")
            _audit(db, employee_id, agent_display_name,
                   f"Skipped {item['item']} -- connector not implemented", str(e))
        except Exception as e:
            # NOTE: status is "in_progress", not "failed" -- "failed" is
            # the TERMINAL state the Monitoring Agent sets once retries
            # are exhausted (see agents/monitoring_agent.py's poll_once).
            # Marking this "failed" immediately (the previous behavior)
            # meant it could never be picked up by poll_once(), which
            # only queries "not_started"/"in_progress" -- the entire
            # retry/backoff mechanism was unreachable from a real first-
            # attempt failure. Known remaining gap even after this fix:
            # STATUS_CHECKERS only verify a resource that already has an
            # external_ref -- a record that failed before ever getting
            # one (this exact case) still won't be retried by
            # poll_once() as currently written, since it requires
            # external_ref to be set. Actually re-attempting creation
            # (not just checking status) needs a second dispatch table
            # in monitoring_agent.py mirroring _PROVISIONING_CALLS --
            # not yet built, see the analysis doc for this as a
            # tracked follow-up rather than something silently patched here.
            record.status = "in_progress"
            record.retry_count += 1
            record.error_detail = str(e)
            db.commit()
            agent_ticket.report_problem(str(e))
            _audit(db, employee_id, agent_display_name,
                   f"Failed {item['item']}", str(e))
            # Monitoring Agent picks this up on its next poll and
            # continues retrying per PDD Section 5 -- no further action
            # needed here.
    _mark(db, employee_id, STEP_PROVISIONING, "completed")

    _draft_and_queue_welcome_email(db, employee, credentials)

    # --- Ticket Generation Agent for Mock items ---
    _mark(db, employee_id, STEP_TICKETING, "running")
    for mock_item in plan["mock_items"]:
        provisioning_agent_key = mock_item["agent_key"] or mock_item["item"]
        record = ProvisioningRecord(
            employee_id=employee_id, provisioning_item=mock_item["item"],
            agent_key=provisioning_agent_key, software_name=mock_item.get("software_name"),
            status="in_progress", last_attempted_at=datetime.datetime.utcnow(),
        )
        db.add(record)
        db.commit()
        db.refresh(record)
    
        # Same AGENT_DISPLAY_NAMES lookup the functional loop above uses.
        # Previously this was f"{mock_item['item']} Agent", which produced
        # names the rest of the system can't map back to an agent_key --
        # routers/onboardingDetails.py resolves an AgentTicket to its
        # ProvisioningRecord through the inverse of AGENT_DISPLAY_NAMES, so
        # e.g. "Productivity Suite creation Agent" (item name) never matched
        # "Productivity Suite Agent" (display name) and those rows fell back
        # to placeholder credentials. Item-derived name kept as the fallback
        # for any mock item whose agent_key isn't in the table.
        agent_name = AGENT_DISPLAY_NAMES.get(provisioning_agent_key) or f"{mock_item['item']} Agent"

        agent_ticket = AgentTicketClient(
            agent_name=agent_name,
            employee_id=employee.employee_id
        )
        try:
            ticket = ticket_agent.create_ticket(db, employee_id, department, mock_item, agent_name)
            agent_ticket.report_started(ticket_reference=ticket.ticket_id)
            # Simulated provisioning result, in the same shape the real
            # connectors return -- so a Mock item fills external_ref,
            # username and the credential store exactly like a Functional
            # one, instead of leaving all three empty. Nothing here is a
            # real account; see integrations/mock_connector.py. Runs BEFORE
            # report_completed() below, which needs its detail sentence.
            result = mock_connector.provision(
                mock_item,
                employee_name=employee.name,
                employee_email=employee.email,
                employee_id=employee.employee_id,
                department=department,
            )
            ticket_agent.update_status(
                db, ticket, "Closed",
                note="Auto-closed: mock item, no real fulfillment required.",
                closed_by="System (mock)",
            )
            record.status = "completed"
            record.external_ref = result["external_ref"]
            record.username = result["username"]
            record.completed_at = datetime.datetime.utcnow()
            db.commit()
            store_credential(
                db, employee_id,
                system=mock_item.get("software_name") or provisioning_agent_key,
                agent_key=provisioning_agent_key,
                username=result["username"],
                password=result["temp_password"],
                provisioning_record_id=record.id,
                external_ref=result["external_ref"],
            )
            agent_ticket.report_completed(detail=result["detail"])
            _audit(db, employee_id, agent_name,
                   f"Provisioned {mock_item['item']} (simulated)", result["detail"])
            # NOTE: deliberately NOT appended to `credentials` -- that list
            # feeds the welcome email (drafted above, before this loop), and
            # a new hire should never be emailed a login that doesn't work.
        except Exception as e:
            agent_ticket.report_problem(str(e))
            raise
    _mark(db, employee_id, STEP_TICKETING, "completed",
          detail=f"{len(plan['mock_items'])} ticket(s) created")

    # Every ticket/record now exists and the mock ones are auto-closed.
    # If all functional connectors also succeeded, onboarding is already
    # fully complete -- flip the employee to "active". No-op (stays
    # "provisioning") if any functional item is still pending/failed;
    # the Monitoring Agent's later close of its failure/retry tickets
    # will re-trigger this same check via update_status.
    mark_active_if_onboarding_complete(db, employee_id, "Onboarding Orchestrator")
    db.refresh(employee)

    # --- Hand off to Monitoring Agent (background loop, not called directly here) ---
    _mark(db, employee_id, STEP_MONITORING, "running")
    _audit(db, employee_id, "Monitoring Agent",
           "Handed off for ongoing polling", "See agents/monitoring_agent.py")

    return {
        "status": employee.status,  # "active" if everything completed, else still "provisioning"
        "role": department,
        "functional_items": len(plan["functional_items"]),
        "mock_items": len(plan["mock_items"]),
    }