from datetime import date

from sqlalchemy import JSON, Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class Invoice(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "invoices"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    client_id: Mapped[str] = mapped_column(ForeignKey("clients.id"), nullable=False, index=True)
    invoice_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    total_amount: Mapped[float] = mapped_column(nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(100), default="draft", nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    party_details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    template_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    pdf_file_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    pdf_file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    user = relationship("User", back_populates="invoices")
    client = relationship("Client", back_populates="invoices")
    bills = relationship("Bill", back_populates="invoice")
    email_drafts = relationship("EmailDraft", back_populates="invoice")
