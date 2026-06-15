from sqlalchemy.orm import Session

from app.models.chat import Chat
from app.models.client import Client
from app.models.conversation import Conversation
from app.services.chat_orchestrator import (
    create_chat_turn as orchestrate_chat_turn,
    create_chat_turn_for_conversation as orchestrate_chat_turn_for_conversation,
    get_or_create_conversation as orchestrate_get_or_create_conversation,
)


def get_or_create_conversation(db: Session, client: Client, owner_id: str) -> Conversation:
    return orchestrate_get_or_create_conversation(db, client=client, owner_id=owner_id)


def create_chat_turn_for_conversation(
    db: Session,
    conversation: Conversation,
    owner_id: str,
    user_message: str,
    uploaded_file_ids: list[str] | None = None,
    chat_id: str | None = None,
) -> Chat:
    return orchestrate_chat_turn_for_conversation(
        db,
        conversation=conversation,
        owner_id=owner_id,
        user_message=user_message,
        uploaded_file_ids=uploaded_file_ids,
        chat_id=chat_id,
    )


def create_chat_turn(db: Session, client: Client, owner_id: str, user_message: str) -> Chat:
    return orchestrate_chat_turn(db, client=client, owner_id=owner_id, user_message=user_message)
