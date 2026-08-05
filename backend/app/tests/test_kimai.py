from app.config import Config
from app.error_logger import ErrorLogger
from app.services import KimaiApiClient
from app.integrations.kimai_connector import KimaiCustomerService,KimaiProjectService,KimaiActivityService,KimaiTimesheetService


# ---- fill these in before running ----
CUSTOMER_ID = 1        # e.g. 1 - get from list_customers() output below
# KIMAI_USER_ID = REPLACE_ME      # e.g. 5 - the employee's Kimai user id
# ---------------------------------------

config = Config()
logger = ErrorLogger()
api_client = KimaiApiClient(config, logger)

customer_service = KimaiCustomerService(api_client, config.kimai_admin_token)
project_service = KimaiProjectService(api_client, config.kimai_admin_token)
activity_service = KimaiActivityService(api_client, config.kimai_admin_token)
timesheet_service = KimaiTimesheetService(api_client, config.kimai_admin_token)

# print("\n=== 1. List customers ===")
# customers = customer_service.list_customers()
# for c in customers:
#     print(f"  id={c['id']}  name={c['name']}")

# print("\n=== 2. Create project ===")
# project = project_service.create_project(
#     name="Test Automation Project",
#     customer_id=CUSTOMER_ID,
#     visible=True,
# )
# project_id = project["id"]
# # print("  Created project:", project)

# print("\n=== 3. List projects ===")
# projects = project_service.list_projects()
# print(f"  Total projects: {len(projects)}")

# print("\n=== 4. Get project by id ===")
# fetched_project = project_service.get_project(project_id)
# print("  Fetched:", fetched_project)

# print("\n=== 5. Update project ===")
# updated_project = project_service.update_project(project_id, name="Test Automation Project (Updated)")
# print("  Updated:", updated_project)

# print("\n=== 6. Create activity under the project ===")
# activity = activity_service.create_activity(
#     name="Test Activity",
#     project_id=11,
#     billable=True,
#     visible=True,
# )
# activity_id = activity["id"]
# print("  Created activity:", activity)

# project_id=11
# print("\n=== 7. List activities for the project ===")
# activities = activity_service.list_activities(project_id=project_id)
# print(activities)
# print(f"  Total activities for project {project_id}: {len(activities)}")

# print("\n=== 8. Update activity ===")
# updated_activity = activity_service.update_activity(activity_id, billable=False)
# print("  Updated:", updated_activity)

# print("\n=== 9. Create a timesheet for the employee ===")
# timesheet = timesheet_service.create_timesheet(
#     kimai_user_id=3,
#     project_id=11,
#     activity_id=5,
#     begin="2026-08-05T09:00:00",
#     end="2026-08-05T17:00:00",
#     description="Test automation timesheet entry",
# )
# timesheet_id = timesheet["id"]
# print("  Created timesheet:", timesheet)

# print("\n=== 10. List timesheets for the employee ===")
# employee_timesheets = timesheet_service.list_timesheets_for_user(3)
# print(employee_timesheets)
# print(f"  Total timesheets for user {3}: {len(employee_timesheets)}")

# print("\n=== 11. Get single timesheet ===")
# fetched_timesheet = timesheet_service.get_timesheet(2)
# print("  Fetched:", fetched_timesheet)

# print("\n=== 12. Update timesheet ===")
# updated_timesheet = timesheet_service.update_timesheet(
#     2, description="Updated description via test script"
# )
# print("  Updated:", updated_timesheet)

# print("\n=== 13. Get projects used by employee (derived from timesheets) ===")
# used_projects = project_service.get_projects_used_by_user(3)
# print(used_projects)
# print("  Projects used:", used_projects)

# timesheet_id=2
# print("\n=== 14. Delete timesheet ===")
# timesheet_service.delete_timesheet(timesheet_id)
# print(f"  Deleted timesheet {timesheet_id}")

# activity_id=1
# print("\n=== 15. Delete activity ===")
# activity_service.delete_activity(activity_id)
# print(f"  Deleted activity {activity_id}")

# project_id=3
# print("\n=== 16. Delete project ===")
# project_service.delete_project(project_id)
# print(f"  Deleted project {project_id}")

# print("\n=== ALL STEPS COMPLETED ===")