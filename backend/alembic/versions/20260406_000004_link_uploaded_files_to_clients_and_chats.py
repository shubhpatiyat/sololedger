"""link uploaded files to clients and chats

Revision ID: 20260406_000004
Revises: 20260406_000003
Create Date: 2026-04-06 21:10:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260406_000004"
down_revision: Union[str, None] = "20260406_000003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "uploaded_bill_files",
        sa.Column("client_id", sa.String(), nullable=True),
    )
    op.add_column(
        "uploaded_bill_files",
        sa.Column("chat_id", sa.String(), nullable=True),
    )
    op.create_foreign_key(
        "fk_uploaded_bill_files_client_id_clients",
        "uploaded_bill_files",
        "clients",
        ["client_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_uploaded_bill_files_chat_id_chats",
        "uploaded_bill_files",
        "chats",
        ["chat_id"],
        ["id"],
    )
    op.create_index(
        op.f("ix_uploaded_bill_files_client_id"),
        "uploaded_bill_files",
        ["client_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_uploaded_bill_files_chat_id"),
        "uploaded_bill_files",
        ["chat_id"],
        unique=False,
    )
    op.execute(
        """
        UPDATE uploaded_bill_files
        SET client_id = (
            SELECT conversations.client_id
            FROM conversations
            WHERE conversations.id = uploaded_bill_files.conversation_id
        )
        """
    )
    op.alter_column("uploaded_bill_files", "client_id", nullable=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_uploaded_bill_files_chat_id"), table_name="uploaded_bill_files")
    op.drop_index(op.f("ix_uploaded_bill_files_client_id"), table_name="uploaded_bill_files")
    op.drop_constraint("fk_uploaded_bill_files_chat_id_chats", "uploaded_bill_files", type_="foreignkey")
    op.drop_constraint("fk_uploaded_bill_files_client_id_clients", "uploaded_bill_files", type_="foreignkey")
    op.drop_column("uploaded_bill_files", "chat_id")
    op.drop_column("uploaded_bill_files", "client_id")
