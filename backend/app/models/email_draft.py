from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class EmailDraft(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "email_drafts"

    owner_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    client_id: Mapped[str] = mapped_column(ForeignKey("clients.id"), nullable=False, index=True)
    invoice_id: Mapped[str] = mapped_column(ForeignKey("invoices.id"), nullable=False, index=True)
    oauth_account_id: Mapped[str | None] = mapped_column(
        ForeignKey("oauth_accounts.id"), nullable=True, index=True
    )
    provider: Mapped[str | None] = mapped_column(String(50), nullable=True)
    recipient_email: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    attachment_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    provider_draft_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="prepared")
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    client = relationship("Client")
    invoice = relationship("Invoice", back_populates="email_drafts")
    oauth_account = relationship("OAuthAccount", back_populates="email_drafts")
