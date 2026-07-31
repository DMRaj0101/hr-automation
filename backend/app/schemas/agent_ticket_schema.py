from pydantic import BaseModel
from typing import Optional


class TicketCreateRequest(BaseModel):
    title: str
    content: str
    agent_name: str
    employee_id: str


class TicketUpdateRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None