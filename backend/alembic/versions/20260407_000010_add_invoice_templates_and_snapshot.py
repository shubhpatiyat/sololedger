"""add invoice templates and snapshot

Revision ID: 20260407_000010
Revises: 20260407_000009
Create Date: 2026-04-07 22:10:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260407_000010"
down_revision: Union[str, None] = "20260407_000009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    tables = set(inspector.get_table_names())

    if "invoice_templates" not in tables:
        op.create_table(
            "invoice_templates",
            sa.Column("user_id", sa.String(), nullable=False),
            sa.Column("name", sa.String(length=100), nullable=False, server_default="Default"),
            sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("template_json", sa.JSON(), nullable=False),
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("user_id", "name", name="uq_invoice_templates_user_name"),
        )
        op.create_index(op.f("ix_invoice_templates_user_id"), "invoice_templates", ["user_id"], unique=False)

    invoice_columns = {column["name"] for column in inspector.get_columns("invoices")}
    if "template_snapshot" not in invoice_columns:
        with op.batch_alter_table("invoices") as batch_op:
            batch_op.add_column(sa.Column("template_snapshot", sa.JSON(), nullable=True))


def downgrade() -> None:
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    tables = set(inspector.get_table_names())

    invoice_columns = {column["name"] for column in inspector.get_columns("invoices")}
    if "template_snapshot" in invoice_columns:
        with op.batch_alter_table("invoices") as batch_op:
            batch_op.drop_column("template_snapshot")

    if "invoice_templates" in tables:
        op.drop_index(op.f("ix_invoice_templates_user_id"), table_name="invoice_templates")
        op.drop_table("invoice_templates")
