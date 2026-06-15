from datetime import date

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class Bill(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "bills"

    client_id: Mapped[str] = mapped_column(ForeignKey("clients.id"), nullable=False, index=True)
    project_id: Mapped[str | None] = mapped_column(ForeignKey("projects.id"), nullable=True, index=True)
    category_id: Mapped[str] = mapped_column(ForeignKey("categories.id"), nullable=False, index=True)
    invoice_id: Mapped[str | None] = mapped_column(ForeignKey("invoices.id"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[float] = mapped_column(nullable=False)
    bill_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    vendor_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    file_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    status: Mapped[str] = mapped_column(String(100), default="captured", nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    client = relationship("Client", back_populates="bills")
    project = relationship("Project", back_populates="bills")
    category = relationship("Category", back_populates="bills")
    invoice = relationship("Invoice", back_populates="bills")
