"""add invoice pdf storage fields

Revision ID: 20260407_000011
Revises: 20260407_000010
Create Date: 2026-04-07 23:05:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260407_000011"
down_revision: Union[str, None] = "20260407_000010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    columns = {column["name"] for column in inspector.get_columns("invoices")}
    with op.batch_alter_table("invoices") as batch_op:
        if "pdf_file_path" not in columns:
            batch_op.add_column(sa.Column("pdf_file_path", sa.String(length=1024), nullable=True))
        if "pdf_file_name" not in columns:
            batch_op.add_column(sa.Column("pdf_file_name", sa.String(length=255), nullable=True))


def downgrade() -> None:
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    columns = {column["name"] for column in inspector.get_columns("invoices")}
    with op.batch_alter_table("invoices") as batch_op:
        if "pdf_file_name" in columns:
            batch_op.drop_column("pdf_file_name")
        if "pdf_file_path" in columns:
            batch_op.drop_column("pdf_file_path")
