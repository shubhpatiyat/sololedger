"""add bill file storage

Revision ID: 20260406_000003
Revises: 20260406_000002
Create Date: 2026-04-06 19:30:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20260406_000003"
down_revision: Union[str, None] = "20260406_000002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "bills",
        sa.Column("file_path", sa.String(length=1024), nullable=True),
    )
    op.create_table(
        "uploaded_bill_files",
        sa.Column("conversation_id", sa.String(), nullable=False),
        sa.Column("owner_id", sa.String(length=255), nullable=False),
        sa.Column("original_file_name", sa.String(length=255), nullable=False),
        sa.Column("file_path", sa.String(length=1024), nullable=False),
        sa.Column("content_type", sa.String(length=255), nullable=True),
        sa.Column("extracted_text", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("id", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["conversation_id"], ["conversations.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_uploaded_bill_files_conversation_id"), "uploaded_bill_files", ["conversation_id"], unique=False)
    op.create_index(op.f("ix_uploaded_bill_files_owner_id"), "uploaded_bill_files", ["owner_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_uploaded_bill_files_owner_id"), table_name="uploaded_bill_files")
    op.drop_index(op.f("ix_uploaded_bill_files_conversation_id"), table_name="uploaded_bill_files")
    op.drop_table("uploaded_bill_files")
    op.drop_column("bills", "file_path")
