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
from app.models import Employee, ProvisioningRecord, Ticket

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
    checklist += [
        {
            "system": t.provisioning_item,
            "platform": t.software_name,
            "status": _map_ticket_status(t.status),
            "kind": "Mock",
            "detail": t.notes,
            "outcome": None,
        }
        for t in tickets
    ]
    return checklist


def _employee_out(employee: Employee, checklist: list[dict]) -> dict:
    total = len(checklist)
    done = sum(1 for c in checklist if c["status"] == "done")
    blocked = sum(1 for c in checklist if c["status"] in ("failed", "blocked"))

    return {
        "id": employee.id,
        "name": employee.name,
        "dept": employee.department,
        "type": "experienced",  # MOCK
        "manager": employee.manager,
        "status": _map_employee_status(employee.status),  # MAP: provisioning -> Onboarding
        "progress": round(100 * done / total) if total else 0,
        "blockers": blocked,
        "start": employee.joining_date,
        "est": "8/15",  # MOCK
        "remaining": 16,  # MOCK
        "email": employee.email,
        "phone": 7598986411,  # MOCK
        "office": employee.office,
        "empManager": employee.manager,
        "hireDate": employee.joining_date,
        "yearsOfService": 1.0,  # MOCK
        "jobLevel": "Associate",  # MOCK
        "title": employee.title,
    }


@router.get("")
def list_employee_directory(db: Session = Depends(get_db)):
    employees = db.query(Employee).all()
    return [_employee_out(e, _build_checklist(db, e.id)) for e in employees]


@router.get("/{employee_id}")
def get_employee_directory_entry(employee_id: str, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return _employee_out(employee, _build_checklist(db, employee_id))


@router.get("/{employee_id}/checklist")
def get_employee_checklist(employee_id: str, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return _build_checklist(db, employee_id)