"""
Credential store for provisioned application accounts.

POC/DEMO ONLY -- passwords are stored in PLAINTEXT, see
models/employee.py's ProvisionedCredential docstring for the reasoning
and the caveats. Anything past the POC should swap this module's
internals for a secrets manager; keeping the reads and writes behind
these two functions is what makes that swap a contained change.

Why this exists: before it, connectors had nowhere to put a credential,
so mailu_connector was writing its temp password into
ProvisioningRecord.external_ref -- a column meant for the target
system's identifier, which the Monitoring Agent polls with. Credentials
live here now; external_ref went back to holding identifiers.

Written from the functional-items loop in
orchestrators/onboarding_orchestrator.py, once per successful item.
Read by routers/onboardingDetails.py for the provisional-status screen.

Follows the same shape as services/onboarding_status.py: module-level
functions taking the caller's Session, so writes land in the caller's
transaction alongside the ProvisioningRecord they belong to. This module
never opens or closes a session of its own.
"""
from sqlalchemy.orm import Session

from app.models import ProvisionedCredential


def store_credential(
    db: Session,
    employee_id: str,
    *,
    system: str | None = None,
    agent_key: str | None = None,
    username: str | None = None,
    password: str | None = None,
    provisioning_record_id: str | None = None,
    external_ref: str | None = None,
) -> ProvisionedCredential:
    """Record the credential issued for one provisioned application.

    Idempotent per provisioning record: run_onboarding() can execute more
    than once for the same employee (retries, re-runs from the UI), and
    each run creates fresh ProvisioningRecords. Within a run, though, the
    same record can be written twice if the orchestrator re-enters the
    loop -- so we update the existing row for a given
    provisioning_record_id rather than inserting a duplicate.

    `password` is deliberately allowed to be None: kimai_connector and
    openkm_connector both return temp_password=None when they reused an
    existing account and issued nothing new. We still want the row, so
    the provisional-status screen has an entry for every provisioned
    application rather than only the newly-issued ones.

    Commits, matching the surrounding orchestrator code which commits
    after each provisioning step.
    """
    existing = None
    if provisioning_record_id:
        existing = (
            db.query(ProvisionedCredential)
            .filter(ProvisionedCredential.provisioning_record_id == provisioning_record_id)
            .first()
        )

    if existing:
        existing.system = system
        existing.agent_key = agent_key
        existing.username = username
        # Only overwrite a stored password when the connector actually
        # issued a new one -- a reused account reports None, and blanking
        # a previously captured credential would lose the only copy.
        if password:
            existing.password = password
        existing.external_ref = external_ref
        db.commit()
        return existing

    credential = ProvisionedCredential(
        employee_id=employee_id,
        provisioning_record_id=provisioning_record_id,
        agent_key=agent_key,
        system=system,
        username=username,
        password=password,
        external_ref=external_ref,
    )
    db.add(credential)
    db.commit()
    db.refresh(credential)
    return credential


def get_credentials_for_employee(db: Session, employee_id: str) -> list[ProvisionedCredential]:
    """Every credential row for one employee, newest first.

    `employee_id` is Employee.id (the UUID primary key), NOT the business
    "EMP-123" identifier -- same convention as ProvisioningRecord.
    """
    return (
        db.query(ProvisionedCredential)
        .filter(ProvisionedCredential.employee_id == employee_id)
        .order_by(ProvisionedCredential.created_at.desc())
        .all()
    )
