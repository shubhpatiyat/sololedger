"""add client address fields

Revision ID: 20260408_000012
Revises: 20260407_000011
Create Date: 2026-04-08 00:10:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260408_000012"
down_revision: Union[str, None] = "20260407_000011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    columns = {column["name"] for column in inspector.get_columns("clients")}

    with op.batch_alter_table("clients") as batch_op:
        if "address_line_1" not in columns:
            batch_op.add_column(sa.Column("address_line_1", sa.String(length=255), nullable=True))
        if "address_line_2" not in columns:
            batch_op.add_column(sa.Column("address_line_2", sa.String(length=255), nullable=True))
        if "city" not in columns:
            batch_op.add_column(sa.Column("city", sa.String(length=100), nullable=True))
        if "state" not in columns:
            batch_op.add_column(sa.Column("state", sa.String(length=100), nullable=True))
        if "postal_code" not in columns:
            batch_op.add_column(sa.Column("postal_code", sa.String(length=20), nullable=True))
        if "country" not in columns:
            batch_op.add_column(sa.Column("country", sa.String(length=100), nullable=True))


def downgrade() -> None:
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    columns = {column["name"] for column in inspector.get_columns("clients")}

    with op.batch_alter_table("clients") as batch_op:
        if "country" in columns:
            batch_op.drop_column("country")
        if "postal_code" in columns:
            batch_op.drop_column("postal_code")
        if "state" in columns:
            batch_op.drop_column("state")
        if "city" in columns:
            batch_op.drop_column("city")
        if "address_line_2" in columns:
            batch_op.drop_column("address_line_2")
        if "address_line_1" in columns:
            batch_op.drop_column("address_line_1")
