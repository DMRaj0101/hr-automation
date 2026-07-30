from sqlalchemy.orm import Session

from app.ai_client import call_ollama_text, OllamaError
from app.services.chatbot.ops_data_service import get_ops_context
from app.services.chatbot.ops_prompt_builder import OpsPromptBuilder


def answer_ops_question(db: Session, question: str) -> dict:
    context = get_ops_context(db)
    prompt = OpsPromptBuilder.build(question, context)

    try:
        answer = call_ollama_text(prompt)
    except OllamaError:
        answer = "Sorry, I'm unable to answer your question right now. Please try again later."

    return {"text": answer, "source": "Knowledge Agent"}
