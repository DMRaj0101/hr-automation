from pydantic import BaseModel,Field
from typing import Optional
from decimal import Decimal


class KimaiUserCreateRequest(BaseModel):
    username: str
    email: str
    password: str


class KimaiTimesheetCreateRequest(BaseModel):
    kimai_user_id: int
    project_id: int
    activity_id: int
    begin: str
    end: str
    description: Optional[str] = None


class KimaiProjectCreateRequest(BaseModel):
    name: str
    customer_id: int
    visible: bool = True


class KimaiProjectUpdateRequest(BaseModel):
    name: Optional[str] = None
    visible: Optional[bool] = None


class KimaiActivityCreateRequest(BaseModel):
    name: str
    project_id: Optional[int] = None
    billable: bool = True
    visible: bool = True


class KimaiActivityUpdateRequest(BaseModel):
    name: Optional[str] = None
    billable: Optional[bool] = None
    visible: Optional[bool] = None

class KimaiTimesheetUpdateRequest(BaseModel):
    begin: Optional[str] = None
    end: Optional[str] = None
    description: Optional[str] = None

class CustomerCreateRequest(BaseModel):
    name: str
    number: str | None = None

class CustomerResponse(BaseModel):
    id: int
    name: str
    number: str | None = None

class TimesheetResponse(BaseModel):
    timesheet_id: int
    duration_hours: float
    hourly_rate: Decimal
    bill: Decimal

class UserRateRequest(BaseModel):
    hourly_rate: Decimal = Field(ge=0)
    internal_rate: Decimal = Field(ge=0)