"""baseline existing schema

Revision ID: 20250406_000001
Revises: 
Create Date: 2026-04-06 12:00:00
"""

from typing import Sequence, Union


from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20250406_000001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Baseline revision for an already-existing schema.
    # Use `alembic stamp head` so Alembic starts tracking from the current DB state.
    pass


def downgrade() -> None:
    pass

