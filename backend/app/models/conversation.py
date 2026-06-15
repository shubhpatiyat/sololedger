from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class Conversation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "conversations"
    __table_args__ = (UniqueConstraint("client_id", name="uq_conversation_client_id"),)

    client_id: Mapped[str] = mapped_column(ForeignKey("clients.id"), nullable=False, index=True)
    owner_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    pending_workflow: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pending_workflow_payload: Mapped[str | None] = mapped_column(Text, nullable=True)

    client = relationship("Client", back_populates="conversation")
    chats = relationship("Chat", back_populates="conversation", cascade="all, delete-orphan")

    @property
    def client_name(self) -> str | None:
        return self.client.name if self.client else None
