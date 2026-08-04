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
            # external_ref is the field models/employee.py's ProvisioningRecord
            # docstring earmarks for "the real system's ID" / API outcome, but
            # no connector populates it yet -- TODO once one does.
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
            # TODO: Ticket has no dedicated "outcome"/system-response field
            # (only status_history, which is JSON and better read via the
            # existing GET /tickets/{ticket_id} endpoint if ever needed here).
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
        # TODO: no "experienced" | "fresher" classification exists anywhere
        # in the backend yet -- Employee has no matching column.
        "type": None,
        "manager": employee.manager,
        "status": employee.status,
        "progress": round(100 * done / total) if total else 0,
        "blockers": blocked,
        "start": employee.joining_date,
        # TODO: no estimated-completion-date field exists (OnboardingTracker/
        # ProvisioningRecord only record actual timestamps), so "est" and the
        # "remaining" days derived from it can't be populated without
        # inventing a new estimate -- left None per instructions.
        "est": None,
        "remaining": None,
        "email": employee.email,
        # TODO: Employee has no phone column.
        "phone": None,
        "office": employee.office,
        # Employee only stores one manager field -- mirrored here since
        # there's no second "employment manager" column to source empManager
        # from separately.
        "empManager": employee.manager,
        "hireDate": employee.joining_date,
        # TODO: computing years-of-service from joining_date would require
        # date-math business logic this router isn't meant to invent.
        "yearsOfService": None,
        # TODO: no job-level column exists on Employee.
        "jobLevel": None,
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
