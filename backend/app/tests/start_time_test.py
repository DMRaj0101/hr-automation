from app.config import Config
from app.database import get_db
from app.services.agent_ticketing_service import TicketRepository,TicketService

config = Config()
db_gen = get_db()
db = next(db_gen)

repository = TicketRepository()
service = TicketService(repository)

service.handle_agent_started(db, "AgentJ", "EMP1010")
import time; time.sleep(2)
service.handle_agent_completed(db, "AgentJ", "EMP1010")

ticket_id = repository.find_ticket_id_for_agent_run(db, "AgentJ", "EMP1010")
ticket = repository.get_ticket_by_id(db, ticket_id)
print("start_time:", ticket["start_time"])
print("end_time:", ticket["end_time"])
print("status:", ticket["status"])

db_gen.close()