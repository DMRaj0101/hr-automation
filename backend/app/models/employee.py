"""
Core SQLAlchemy models -- trimmed for PDD v3 (AI Orchestration POC).

Kept from the previous version, unchanged in shape: Employee, AuditLog,
OnboardingTracker (now doubling as the "Execution Trace" screen's data
source), WelcomeEmail.

New: Ticket (PDD Section 4.1's exact schema) and ProvisioningRecord
(tracks the real-system state behind each Functional provisioning item,
so the Monitoring Agent has rows to poll and the Knowledge Agent has
rows to answer "which applications do I have access to" from).

Removed entirely (see MIGRATION_NOTES.md for the full reasoning):
offboarding models, per-task human-approval models (OnboardingTask/
OffboardingTask/Approval), document-validation models, license/seat
models, risk assessment, reports. None of these map to the new
6-step orchestration flow in the PDD.
"""
import datetime
import uuid
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, Text, Boolean, Integer
from sqlalchemy.orm import relationship
from app.database import Base


def gen_id():
    return str(uuid.uuid4())


class Employee(Base):
    __tablename__ = "employees"

    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)
    employee_id = Column(String, unique=True, nullable=False)
    email = Column(String, nullable=False)
    department = Column(String, nullable=False)
    role = Column(String, nullable=True)  # Tax | Audit | Law | IT Support -- from HRMS directly if provided; AI classifier (role_classifier.py) is fallback-only
    office = Column(String, nullable=True)
    manager = Column(String, nullable=True)
    phonenumber = Column(String, nullable=True)
    years_of_experience = Column(Float, nullable=True)  # 1 | 2 | 3 -- from HRMS directly if provided; AI classifier (role_classifier.py) is fallback-only
    employee_location = Column(String, nullable=True)
    joining_date = Column(String, nullable=True)
    job_Level = Column(String, nullable=True)
    sync_source = Column(String, default="manual")  # "manual" | "hrms"
    status = Column(String, default="registered")  # registered -> provisioning -> active
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class RoleClassification(Base):
    """AI role-classification result, kept only for when HRMS doesn't
    send a valid role and role_classifier.py has to guess -- see
    orchestrators/onboarding_orchestrator.py's role resolution step."""
    __tablename__ = "role_classifications"

    id = Column(String, primary_key=True, default=gen_id)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    predicted_role = Column(String, nullable=False)
    confidence = Column(Float, default=0.0)
    reasoning = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class OnboardingTracker(Base):
    """Step-level execution log -- Registered / Decision / <per-item
    provisioning> / Monitoring. This is what backs both the Onboarding
    Tracker (reused screen) and the new Execution Trace screen (PDD
    Section 9) -- same rows, two different frontend views over them."""
    __tablename__ = "onboarding_tracker"

    id = Column(String, primary_key=True, default=gen_id)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    step = Column(String, nullable=False)
    status = Column(String, default="waiting")  # waiting | running | completed | failed
    detail = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


class ProvisioningRecord(Base):
    """One row per Functional provisioning item actually attempted for
    an employee (Identity / Email / Time & Billing / Asset). This is
    the row the Monitoring Agent polls and retries against, and the row
    the Knowledge Agent reads for "which applications do I have access
    to" / "is Keycloak having issues" style questions.

    TODO (owner: whoever implements each connector): once a connector
    returns a real system ID for its item (e.g. the Keycloak user UUID,
    the Snipe-IT asset tag, the Kimai username), store it in
    external_ref so the Monitoring Agent can look the record up in the
    real system on each poll instead of only trusting our own DB state.
    """
    __tablename__ = "provisioning_records"

    id = Column(String, primary_key=True, default=gen_id)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    provisioning_item = Column(String, nullable=False)  # e.g. "Identity Account Creation"
    agent_key = Column(String, nullable=False)  # "identity" | "email" | "time_billing" | "asset"
    software_name = Column(String, nullable=True)  # e.g. "Keycloak"
    status = Column(String, default="not_started")  # not_started | in_progress | completed | failed
    external_ref = Column(String, nullable=True)  # TODO: populate with the real system's ID for this record once the connector returns one
    retry_count = Column(Integer, default=0)
    username = Column(String, nullable=True)  # e.g. the Kimai username, the Snipe-IT asset tag, the Keycloak user UUID
    last_attempted_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    error_detail = Column(Text, nullable=True)  # set on failure, read by Monitoring Agent + surfaced on auto-created ticket
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Ticket(Base):
    """PDD Section 4.1's exact schema. One ticket per Mock provisioning
    item (not one parent ticket with child tasks, per Section 4.3) --
    Functional items never get a ticket, since they're provisioned for
    real with no human follow-up needed.

    status values per Section 4.2: Open -> In Progress -> Pending -> Closed
    (Pending is a side-branch, not always visited)."""
    __tablename__ = "tickets"

    id = Column(String, primary_key=True, default=gen_id)
    ticket_id = Column(String, unique=True, nullable=False)  # human-facing ID, e.g. "TKT-1002"
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    role = Column(String, nullable=False)
    provisioning_item = Column(String, nullable=False)
    software_name = Column(String, nullable=True)
    assigned_team = Column(String, nullable=False)  # IT | Admin | Security | Facilities | Payroll
    status = Column(String, default="Open")  # Open | In Progress | Pending | Closed
    status_history = Column(Text, nullable=True)  # JSON-encoded list of {status, changed_at, note}
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    status_changed_at = Column(DateTime, default=datetime.datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)
    closed_by = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    sla_flagged_at = Column(DateTime, nullable=True)  # set once when Monitoring Agent detects a Pending > 4h breach -- one-shot, so the same ticket doesn't re-alert every poll cycle


class WelcomeEmail(Base):
    """Real welcome email sent to a new hire at the start of onboarding.
    Kept unchanged from the previous version -- maps to PDD Section 6.2's
    I2 ("Mailbox successfully created" -> welcome email w/ login info)."""
    __tablename__ = "welcome_emails"

    id = Column(String, primary_key=True, default=gen_id)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=False)
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    status = Column(String, default="drafted")  # drafted | sent
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)
    sent_at = Column(DateTime, nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(String, primary_key=True, default=gen_id)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=True)
    agent = Column(String, nullable=False)
    action = Column(String, nullable=False)
    detail = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


class AgentHealth(Base):
    __tablename__ = "Agent_Health"
    id = Column(String, primary_key=True, default=gen_id)
    agent = Column(String, nullable=False)
    status = Column(String, default="Operational")  # Operational | down
    latency_ms = Column(Float, nullable=True)  # round-trip latency from the last health_check_orchestrator sweep
    last_heartbeat = Column(DateTime, default=datetime.datetime.utcnow)
    context = Column(Text, nullable=True)  # Additional context for the agent's health status
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
