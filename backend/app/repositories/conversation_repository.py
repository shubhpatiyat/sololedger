from sqlalchemy.orm import Session

from app.models.client import Client
from app.models.conversation import Conversation


def get_by_client_owner(db: Session, *, client_id: str, owner_id: str) -> Conversation | None:
    return (
        db.query(Conversation)
        .filter(Conversation.client_id == client_id, Conversation.owner_id == owner_id)
        .first()
    )


def get_or_create(db: Session, *, client: Client, owner_id: str) -> Conversation:
    conversation = get_by_client_owner(db, client_id=client.id, owner_id=owner_id)
    if conversation:
        return conversation

    conversation = Conversation(
        client_id=client.id,
        owner_id=owner_id,
        title=f"{client.name} conversation",
    )
    db.add(conversation)
    db.flush()
    return conversation
