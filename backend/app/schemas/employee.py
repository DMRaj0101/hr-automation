from pydantic import BaseModel
from typing import Optional


class EmployeeCreate(BaseModel):
    name: str
    employee_id: str
    email: str
    department: str
    title: Optional[str] = None
    role: Optional[str] = None  # Tax | Audit | Law | IT Support -- from HRMS directly if provided; AI classifier is fallback-only
    office: Optional[str] = None
    manager: Optional[str] = None
    joining_date: Optional[str] = None
    sync_source: Optional[str] = "manual"


class EmployeeOut(BaseModel):
    id: str
    name: str
    employee_id: str
    email: str
    department: str
    title: Optional[str]
    role: Optional[str]
    office: Optional[str]
    manager: Optional[str]
    joining_date: Optional[str]
    sync_source: str
    status: str

    class Config:
        from_attributes = True
