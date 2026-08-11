from pydantic import BaseModel
from typing import Optional


class EmployeeCreate(BaseModel):
    name: str
    employee_id: str
    email: str
    department: str
    role: Optional[str] = None  # Tax | Audit | Law | IT Support -- from HRMS directly if provided; AI classifier is fallback-only
    office: Optional[str] = None
    manager: Optional[str] = None
    phonenumber: Optional[str] = None
    years_of_experience: Optional[float] = None
    employee_location: Optional[str] = None
    job_Level: Optional[str] = None
    joining_date: Optional[str] = None
    sync_source: Optional[str] = "manual"


class EmployeeOut(BaseModel):
    id: str
    name: str
    employee_id: str
    email: str
    department: str
    role: Optional[str]
    office: Optional[str]
    manager: Optional[str]
    phonenumber: Optional[str]
    years_of_experience: Optional[float]
    employee_location: Optional[str]
    job_Level: Optional[str]
    joining_date: Optional[str]
    sync_source: str
    status: str

    class Config:
        from_attributes = True
