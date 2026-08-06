from fastapi import APIRouter, HTTPException
from app.config import Config
from app.error_logger import ErrorLogger
from app.services import KimaiApiClient
from app.integrations.kimai_connector import KimaiUserService,KimaiTimesheetService,KimaiCustomerService,KimaiProjectService,KimaiActivityService
from app.schemas.kimai_schemas import (KimaiUserCreateRequest, KimaiTimesheetCreateRequest,KimaiProjectCreateRequest, KimaiProjectUpdateRequest,KimaiActivityCreateRequest, KimaiActivityUpdateRequest,KimaiTimesheetUpdateRequest, CustomerCreateRequest,CustomerResponse, TimesheetResponse)
from app.exceptions.kimai_exceptions import KimaiClientServiceError

router = APIRouter(prefix="/kimai", tags=["Kimai"])

_config = Config()
_logger = ErrorLogger()
_api_client = KimaiApiClient(_config, _logger)
_user_service = KimaiUserService(_api_client, _config)
_timesheet_service = KimaiTimesheetService(_api_client, _config.kimai_admin_token)
_customer_service = KimaiCustomerService(_api_client, _config.kimai_admin_token)
_project_service = KimaiProjectService(_api_client, _config.kimai_admin_token)
_activity_service = KimaiActivityService(_api_client, _config.kimai_admin_token)

@router.post("/users", operation_id="kimai_create_user")
def create_user(request: KimaiUserCreateRequest):
    try:
        return _user_service.create_user(
            username=request.username,
            email=request.email,
            password=request.password,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/timesheets", operation_id="kimai_create_timesheet")
def create_timesheet(request: KimaiTimesheetCreateRequest):
    try:
        kimai_data = _timesheet_service.create_timesheet(
            kimai_user_id=request.kimai_user_id,
            project_id=request.project_id,
            activity_id=request.activity_id,
            begin=request.begin,
            end=request.end,
            description=request.description,
        )
        print(f"Kimai timesheet created: {kimai_data}")
        return TimesheetResponse(
        timesheet_id=kimai_data["id"],
        duration_hours=kimai_data["duration"] / 3600,
        hourly_rate=kimai_data["hourlyRate"],
        bill=kimai_data["rate"]
    )
    
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

@router.get("/customers", operation_id="kimai_list_customers")
def list_customers():
    try:
        response=_customer_service.list_customers()
        return [CustomerResponse(**customer) for customer in response]
    except KimaiClientServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/projects", operation_id="kimai_create_project")
def create_project(request: KimaiProjectCreateRequest):
    try:
        return _project_service.create_project(request.name, request.customer_id, request.visible)
    except KimaiClientServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/projects", operation_id="kimai_list_projects")
def list_projects():
    try:
        return _project_service.list_projects()
    except KimaiClientServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/projects/{project_id}", operation_id="kimai_get_project")
def get_project(project_id: int):
    try:
        return _project_service.get_project(project_id)
    except KimaiClientServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.put("/projects/{project_id}", operation_id="kimai_update_project")
def update_project(project_id: int, request: KimaiProjectUpdateRequest):
    try:
        return _project_service.update_project(project_id, request.name, request.visible)
    except KimaiClientServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.delete("/projects/{project_id}", operation_id="kimai_delete_project")
def delete_project(project_id: int):
    try:
        _project_service.delete_project(project_id)
        return {"project_id": project_id, "deleted": True}
    except KimaiClientServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/activities", operation_id="kimai_create_activity")
def create_activity(request: KimaiActivityCreateRequest):
    try:
        return _activity_service.create_activity(
            request.name, request.project_id, request.billable, request.visible
        )
    except KimaiClientServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/activities", operation_id="kimai_list_activities")
def list_activities(project_id: int = None):
    try:
        return _activity_service.list_activities(project_id)
    except KimaiClientServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/activities/{activity_id}", operation_id="kimai_get_activity")
def get_activity(activity_id: int):
    try:
        return _activity_service.get_activity(activity_id)
    except KimaiClientServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.put("/activities/{activity_id}", operation_id="kimai_update_activity")
def update_activity(activity_id: int, request: KimaiActivityUpdateRequest):
    try:
        return _activity_service.update_activity(
            activity_id, request.name, request.billable, request.visible
        )
    except KimaiClientServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.delete("/activities/{activity_id}", operation_id="kimai_delete_activity")
def delete_activity(activity_id: int):
    try:
        _activity_service.delete_activity(activity_id)
        return {"activity_id": activity_id, "deleted": True}
    except KimaiClientServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))

@router.get("/employees/{kimai_user_id}/timesheets", operation_id="kimai_list_employee_timesheets")
def list_employee_timesheets(kimai_user_id: int):
    try:
        return _timesheet_service.list_timesheets_for_user(kimai_user_id)
    except KimaiClientServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/employees/{kimai_user_id}/projects", operation_id="kimai_list_employee_projects")
def list_employee_projects(kimai_user_id: int):
    try:
        return _project_service.get_projects_used_by_user(kimai_user_id)
    except KimaiClientServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/timesheets/{timesheet_id}", operation_id="kimai_get_timesheet")
def get_timesheet(timesheet_id: int):
    try:
        return _timesheet_service.get_timesheet(timesheet_id)
    except KimaiClientServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.put("/timesheets/{timesheet_id}", operation_id="kimai_update_timesheet")
def update_timesheet(timesheet_id: int, request: KimaiTimesheetUpdateRequest):
    try:
        return _timesheet_service.update_timesheet(
            timesheet_id, request.begin, request.end, request.description
        )
    except KimaiClientServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.delete("/timesheets/{timesheet_id}", operation_id="kimai_delete_timesheet")
def delete_timesheet(timesheet_id: int):
    try:
        _timesheet_service.delete_timesheet(timesheet_id)
        return {"timesheet_id": timesheet_id, "deleted": True}
    except KimaiClientServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/customers")
def create_customer(customer: CustomerCreateRequest)-> CustomerResponse:
    try:
        response=_customer_service.create_customer(customer.name,customer.number)
        return CustomerResponse(**response)
    except KimaiClientServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.put("/activities/{activity_id}/rates", operation_id="kimai_set_activity_rates")
def set_activity_rates(activity_id: int, hourly_rate: float, internal_rate: float): 
    try:
        return _activity_service.set_rates_for_activity(activity_id, hourly_rate, internal_rate)
    except KimaiClientServiceError as e:
        raise HTTPException(status_code=502, detail=str(e))