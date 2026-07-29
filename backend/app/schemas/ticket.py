from pydantic import BaseModel
from typing import Optional


class TicketStatusUpdate(BaseModel):
    status: str  # "Open" | "In Progress" | "Pending" | "Closed" -- PDD Section 4.2
    note: Optional[str] = None  # required in practice when moving to "Pending" (blocker reason) -- TODO: enforce in routers/tickets.py once the team agrees whether this should be a hard validation or just a UI convention


class TicketOut(BaseModel):
    id: str
    ticket_id: str
    employee_id: str
    role: str
    provisioning_item: str
    software_name: Optional[str]
    assigned_team: str
    status: str
    notes: Optional[str]

    class Config:
        from_attributes = True
