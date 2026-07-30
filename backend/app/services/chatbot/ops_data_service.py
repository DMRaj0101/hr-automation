"""
Live operational data for the Knowledge Agent's second capability:
answering questions about tickets/employees/system health from real
DB state, as opposed to hr_assistant's FAISS policy-document path.
No system-health table exists yet (ProvisioningRecord tracks per-item
status, not per-system reachability) -- system_health is derived from
ProvisioningRecord rows until a real health-check model/connector exists.
"""
from sqlalchemy.orm import Session
from app.models import Employee, Ticket, ProvisioningRecord


def get_ops_context(db: Session) -> dict:
    employees = db.query(Employee).all()
    tickets = db.query(Ticket).all()
    provisioning = db.query(ProvisioningRecord).all()

    employees_data = [
        {
            "employee_id": e.employee_id,
            "name": e.name,
            "department": e.department,
            "status": e.status,
        }
        for e in employees
    ]

    tickets_data = [
        {
            "ticket_id": t.ticket_id,
            "employee_id": t.employee_id,
            "provisioning_item": t.provisioning_item,
            "software_name": t.software_name,
            "assigned_team": t.assigned_team,
            "status": t.status,
        }
        for t in tickets
    ]

    systems: dict[str, dict] = {}
    for p in provisioning:
        if not p.software_name:
            continue
        entry = systems.setdefault(
            p.software_name, {"name": p.software_name, "failed": 0, "total": 0}
        )
        entry["total"] += 1
        if p.status == "failed":
            entry["failed"] += 1

    system_health_data = [
        {
            "name": s["name"],
            "status": "down" if s["failed"] > 0 else "operational",
        }
        for s in systems.values()
    ]

    return {
        "employees": employees_data,
        "tickets": tickets_data,
        "system_health": system_health_data,
    }
