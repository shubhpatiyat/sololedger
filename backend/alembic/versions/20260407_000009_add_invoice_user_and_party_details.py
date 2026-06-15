"""add invoice user and party details

Revision ID: 20260407_000009
Revises: 20260407_000008
Create Date: 2026-04-07 20:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260407_000009"
down_revision: Union[str, None] = "20260407_000008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    columns = {column["name"] for column in inspector.get_columns("invoices")}

    if "user_id" not in columns:
        with op.batch_alter_table("invoices") as batch_op:
            batch_op.add_column(sa.Column("user_id", sa.String(), nullable=True))

        connection.execute(
            sa.text(
                """
                UPDATE invoices
                SET user_id = (
                    SELECT clients.owner_id
                    FROM clients
                    WHERE clients.id = invoices.client_id
                )
                """
            )
        )

        with op.batch_alter_table("invoices") as batch_op:
            batch_op.alter_column("user_id", existing_type=sa.String(), nullable=False)
            batch_op.create_index(op.f("ix_invoices_user_id"), ["user_id"], unique=False)
            batch_op.create_foreign_key("fk_invoices_user_id_users", "users", ["user_id"], ["id"])

    if "party_details" not in columns:
        with op.batch_alter_table("invoices") as batch_op:
            batch_op.add_column(sa.Column("party_details", sa.JSON(), nullable=True))


def downgrade() -> None:
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    columns = {column["name"] for column in inspector.get_columns("invoices")}
    indexes = {index["name"] for index in inspector.get_indexes("invoices")}
    foreign_keys = {fk["name"] for fk in inspector.get_foreign_keys("invoices") if fk.get("name")}

    with op.batch_alter_table("invoices") as batch_op:
        if "party_details" in columns:
            batch_op.drop_column("party_details")
        if "fk_invoices_user_id_users" in foreign_keys:
            batch_op.drop_constraint("fk_invoices_user_id_users", type_="foreignkey")
        if op.f("ix_invoices_user_id") in indexes:
            batch_op.drop_index(op.f("ix_invoices_user_id"))
        if "user_id" in columns:
            batch_op.drop_column("user_id")
