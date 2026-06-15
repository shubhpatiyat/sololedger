from sqlalchemy.orm import Session

from app.models.chat import Chat
from app.models.client import Client
from app.models.conversation import Conversation
from app.repositories.conversation_repository import get_or_create
from app.services.expense_service import build_contextual_user_message, handle_structured_expense_flow
from app.services.llm.decision_service import generate_assistant_reply


def get_or_create_conversation(db: Session, *, client: Client, owner_id: str) -> Conversation:
    return get_or_create(db, client=client, owner_id=owner_id)


def create_chat_turn_for_conversation(
    db: Session,
    *,
    conversation: Conversation,
    owner_id: str,
    user_message: str,
    uploaded_file_ids: list[str] | None = None,
    chat_id: str | None = None,
) -> Chat:
    client = conversation.client
    if client is None:
        raise ValueError("Conversation must be associated with a client")

    assistant_message = handle_structured_expense_flow(
        db,
        client=client,
        conversation=conversation,
        owner_id=owner_id,
        user_message=user_message,
        uploaded_file_ids=uploaded_file_ids,
    )

    if assistant_message is None:
        fallback_message = build_contextual_user_message(
            db,
            conversation_id=conversation.id,
            user_message=user_message,
            uploaded_file_ids=uploaded_file_ids,
        )
        assistant_message = generate_assistant_reply(client=client, user_message=fallback_message)

    chat = Chat(
        id=chat_id,
        conversation_id=conversation.id,
        user_message=user_message,
        assistant_message=assistant_message,
    )
    db.add(chat)
    db.flush()
    db.commit()
    db.refresh(chat)
    return chat


def create_chat_turn(db: Session, *, client: Client, owner_id: str, user_message: str) -> Chat:
    conversation = get_or_create_conversation(db, client=client, owner_id=owner_id)
    return create_chat_turn_for_conversation(
        db,
        conversation=conversation,
        owner_id=owner_id,
        user_message=user_message,
    )
