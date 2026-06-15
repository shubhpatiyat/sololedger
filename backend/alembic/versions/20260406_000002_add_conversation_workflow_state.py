"""add conversation workflow state

Revision ID: 20260406_000002
Revises: 20250406_000001
Create Date: 2026-04-06 18:30:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20260406_000002"
down_revision: Union[str, None] = "20250406_000001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "conversations",
        sa.Column("pending_workflow", sa.String(length=100), nullable=True),
    )
    op.add_column(
        "conversations",
        sa.Column("pending_workflow_payload", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("conversations", "pending_workflow_payload")
    op.drop_column("conversations", "pending_workflow")
