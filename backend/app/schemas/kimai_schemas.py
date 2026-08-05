from pydantic import BaseModel
from typing import Optional


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