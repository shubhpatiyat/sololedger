from pydantic import BaseModel

from app.schemas.common import TimestampResponse


class UploadedBillFileRead(TimestampResponse):
    conversation_id: str
    bill_id: str | None = None
    file_name: str
    content_type: str | None = None
    file_url: str


class ChatRead(TimestampResponse):
    conversation_id: str
    user_message: str
    assistant_message: str | None = None
    attachments: list[UploadedBillFileRead] = []


class ConversationRead(TimestampResponse):
    client_id: str
    owner_id: str
    title: str | None = None
    client_name: str | None = None


class ChatCreate(BaseModel):
    client_id: str
    user_message: str
