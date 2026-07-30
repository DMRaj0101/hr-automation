from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.chatbot import OpsChatRequest, OpsChatResponse
from app.services.chatbot.ops_chat_service import answer_ops_question

router = APIRouter(
    prefix="/hr-assistant",
    tags=["HR Assistant"]
)


@router.post("/ops-chat", response_model=OpsChatResponse)
def ops_chat(request: OpsChatRequest, db: Session = Depends(get_db)):
    """Live-data Q&A over tickets/employees/system health, pulled
    straight from Postgres and handed to Ollama as context."""
    return answer_ops_question(db, request.question)
