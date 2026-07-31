from app.services.agent_ticketing_service import AgentTicketClient

client = AgentTicketClient(agent_name="AgentI", employee_id="EMP9009")

client.report_started()
print("Started - ticket should exist immediately")

client.report_completed()
print("Completed - ticket should be CLOSED immediately, no polling wait")