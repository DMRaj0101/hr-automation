# from app.services.agent_ticketing_service import AgentTicketClient

# client = AgentTicketClient(agent_name="AgentI", employee_id="EMP9009")

# # client.report_started()
# # print("Started - ticket should exist immediately")

# client.report_problem("sample error")
# print("Started - ticket should exist immediately")


# client.report_completed()
# print("Completed - ticket should be CLOSED immediately, no polling wait")


from app.config import Config
from app.database import get_db
from app.services.agent_ticketing_service import TicketRepository,TicketService

db_gen = get_db()
db = next(db_gen)
repository = TicketRepository()
service = TicketService(repository)

# service.handle_agent_started(db, "AgentK", "EMP1111")
# ticket_id = repository.find_ticket_id_for_agent_run(db, "AgentK", "EMP1111")
# t = repository.get_ticket_by_id(db, ticket_id)
# print("Reference:", t["ticket_reference"])
# print("Content after start:", t["content"])
# print("Followups:", len(t["followups"]))

# service.handle_agent_completed(db, "AgentK", "EMP1111")
# t = repository.get_ticket_by_id(db, ticket_id)
# print("Content after complete:", t["content"])
# print("Followups:", len(t["followups"]))

service.handle_agent_problem(db, "AgentK", "EMP1111","sample_error_hasing")
db_gen.close()