"""
Employee Directory screen -- read-only endpoints that reshape existing
Employee, ProvisioningRecord, and Ticket rows into what the frontend's
Employee Directory / Employee Profile pages expect. No new business
logic: every value is either read straight off an existing model column
or a presentation-layer combination of existing rows -- the same
ProvisioningRecord + Ticket combination routers/profile.py's get_profile()
already does, just reshaped into a flat checklist here.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Employee, ProvisioningRecord, Ticket, AgentTicket

router = APIRouter(prefix="/employee-directory", tags=["employee-directory"])


def _map_provisioning_status(status: str) -> str:
    return {
        "completed": "done",
        "in_progress": "inProgress",
        "failed": "failed",
        "not_started": "pending",
    }.get(status, "pending")


def _map_ticket_status(status: str) -> str:
    return {
        "Closed": "done",
        "In Progress": "inProgress",
        "Pending": "blocked",
        "Open": "pending",
    }.get(status, "pending")


def _map_employee_status(status: str) -> str:
    """Map backend employee status to frontend Employment Lifecycle display values."""
    return {
        "provisioning": "Onboarding",
        "onboarding": "Onboarding",
        "in-progress": "Onboarding",
        "in_progress": "Onboarding",
        "registered": "Active",
        "active": "Active",
        "offboarding": "Offboarding",
        "inactive": "Offboarding",
        "pending": "Pending",
    }.get(status.lower() if status else "", status or "Pending")


def _provisioning_detail(record: ProvisioningRecord) -> str:
    if record.status == "completed":
        return f"Completed{f' on {record.completed_at.date()}' if record.completed_at else ''}"
    if record.status == "failed":
        return record.error_detail or "Failed"
    if record.status == "in_progress":
        return f"In progress (attempt {record.retry_count})" if record.retry_count else "In progress"
    return "Not started"

def _format_dt(value):

    return value.strftime("%d-%m-%Y %H:%M:%S") if value else None

from datetime import datetime, timedelta

def _planned_date(joining_date):
    if not joining_date:
        return None

    if isinstance(joining_date, str):
        joining_date = datetime.strptime(joining_date, "%Y-%m-%d").date()

    return joining_date - timedelta(days=3)


def _days_remaining(joining_date):
    """
    Returns the number of days remaining until the planned
    completion date.
    """
    planned_date = _planned_date(joining_date)

    if not planned_date:
        return None

    today = datetime.now().date()

    # If planned_date is a datetime, convert it to a date
    if hasattr(planned_date, "date"):
        planned_date = planned_date.date()

    return (planned_date - today).days


def _agent_progress(db: Session, employee_business_id: str) -> str:
    """Completed vs in-progress agent count for this employee, read from
    AgentTicket.status -- only two buckets: "CLOSED" is completed,
    anything else (NEW / PROCESSING / FAILED) counts as in progress.
    Replaces the previous "8/15" placeholder in the est field.
    AgentTicket.employee_id stores the business employee_id (e.g.
    "EMP1001"), not the internal Employee.id UUID -- same lookup key
    routers/onboardingDetails.py uses."""
    tickets = db.query(AgentTicket).filter(AgentTicket.employee_id == employee_business_id).all()
    completed = sum(1 for t in tickets if t.status.upper() == "CLOSED")
    in_progress = sum(1 for t in tickets if t.status.upper() != "CLOSED")
    return f"{completed}/{in_progress}"


def _build_checklist(db: Session, employee_id: str) -> list[dict]:
    """Functional items come from ProvisioningRecord, Mock items come from
    Ticket -- see models/employee.py's Ticket docstring: "Functional items
    never get a ticket... Mock provisioning items get one ticket each."
    Combining the two here (not in either model or another router) is what
    gives the frontend its single flat checklist."""
    provisioning = (
        db.query(ProvisioningRecord)
        .filter(ProvisioningRecord.employee_id == employee_id)
        .all()
    )
    tickets = db.query(Ticket).filter(Ticket.employee_id == employee_id).all()

    checklist = [
        {
            "system": r.provisioning_item,
            "platform": r.software_name,
            "status": _map_provisioning_status(r.status),
            "kind": "Functional",
            "detail": _provisioning_detail(r),
            "outcome": r.external_ref,
        }
        for r in provisioning
    ]
    # checklist += [
    #     {
    #         "system": t.provisioning_item,
    #         "platform": t.software_name,
    #         "status": _map_ticket_status(t.status),
    #         "kind": "Mock",
    #         "detail": t.notes,
    #         "outcome": None,
    #     }
    #     for t in tickets
    # ]
    return checklist
def experience_type(years_of_experience: float) -> str:
    if years_of_experience is None:
        return "Unknown"
    
    elif  years_of_experience < 1:
        return "Fresher"
    else:
        return "Experienced"

def _employee_out(employee: Employee, checklist: list[dict], agent_progress: str) -> dict:
    total = len(checklist)
    done = sum(1 for c in checklist if c["status"] == "done")
    blocked = sum(1 for c in checklist if c["status"] in ("failed", "blocked"))

    return {
        "id": employee.id,
        "employee_id": employee.employee_id,
        "name": employee.name,
        "employee_id":employee.employee_id,
        "dept": employee.department,
        "type": employee.job_Level,  # MOCK
        "manager": employee.manager,
        "status": _map_employee_status(employee.status),  # MAP: provisioning -> Onboarding
        "progress": round(100 * done / total) if total else 0,
        "blockers": blocked,
        "start": employee.joining_date,
        "est": agent_progress,  # "<completed>/<in progress>" from AgentTicket
        "remaining": _days_remaining(employee.joining_date),  # MOCK
        "email": employee.email,
        "phone": employee.phonenumber,  # MOCK
        "office": employee.office,
        "employee location": employee.employee_location,
        "empManager": employee.manager,
        "hireDate": employee.joining_date,
        "yearsOfService": employee.years_of_experience,  # MOCK
        "jobLevel": employee.job_Level,  # MOCK
        "title": employee.role,
    }


@router.get("")
def list_employee_directory(db: Session = Depends(get_db)):
    employees = db.query(Employee).all()
    return [_employee_out(e, _build_checklist(db, e.id), _agent_progress(db, e.employee_id)) for e in employees]


@router.get("/{employee_id}")
def get_employee_directory_entry(employee_id: str, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return _employee_out(employee, _build_checklist(db, employee_id), _agent_progress(db, employee.employee_id))


@router.get("/{employee_id}/checklist")
def get_employee_checklist(employee_id: str, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return _build_checklist(db, employee_id)