from pydantic import BaseModel


class OpsChatRequest(BaseModel):
    question: str


class OpsChatResponse(BaseModel):
    text: str
    source: str
