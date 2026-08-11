from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class AgentTicket(Base):
    __tablename__ = "agent_tickets"

    ticket_id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="New")  # NEW / PROCESSING / CLOSED
    agent_name = Column(String(100), nullable=False)
    employee_id = Column(String(50), nullable=False)
    start_time = Column("start_time", DateTime, nullable=True)
    end_time = Column("end_time", DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    followups = relationship("TicketFollowup", back_populates="ticket")


class TicketFollowup(Base):
    __tablename__ = "ticket_followups"

    followup_id = Column(Integer, primary_key=True, autoincrement=True)
    ticket_id = Column(Integer, ForeignKey("agent_tickets.ticket_id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("AgentTicket", back_populates="followups")