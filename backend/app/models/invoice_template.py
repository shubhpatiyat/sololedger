from sqlalchemy import JSON, Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class InvoiceTemplate(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "invoice_templates"
    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_invoice_templates_user_name"),
    )

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, default="Default")
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    template_json: Mapped[dict] = mapped_column(JSON, nullable=False)

    user = relationship("User", back_populates="invoice_templates")
