"""add user foreign keys and profiles

Revision ID: 20260407_000007
Revises: 20260407_000006
Create Date: 2026-04-07 12:30:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260407_000007"
down_revision: Union[str, None] = "20260407_000006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    table_names = inspector.get_table_names()

    if "user_profiles" not in table_names:
        op.create_table(
            "user_profiles",
            sa.Column("user_id", sa.String(), nullable=False),
            sa.Column("name", sa.String(length=255), nullable=True),
            sa.Column("address", sa.Text(), nullable=True),
            sa.Column("pincode", sa.String(length=20), nullable=True),
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("user_id"),
        )
        op.create_index(op.f("ix_user_profiles_user_id"), "user_profiles", ["user_id"], unique=True)
        inspector = sa.inspect(connection)
        table_names = inspector.get_table_names()
    else:
        user_profile_indexes = {index["name"] for index in inspector.get_indexes("user_profiles")}
        if op.f("ix_user_profiles_user_id") not in user_profile_indexes:
            op.create_index(op.f("ix_user_profiles_user_id"), "user_profiles", ["user_id"], unique=True)

    if "users" in table_names:
        # Backfill placeholder users for any legacy owner_id values before adding FKs.
        connection.execute(
            sa.text(
                """
                INSERT INTO users (id, email, password_hash, first_name, last_name, is_active)
                SELECT missing.owner_id,
                       CONCAT(missing.owner_id, '@local.sololedger'),
                       'migration-placeholder',
                       missing.owner_id,
                       NULL,
                       TRUE
                FROM (
                    SELECT owner_id FROM clients
                    UNION
                    SELECT owner_id FROM categories
                    UNION
                    SELECT owner_id FROM oauth_accounts
                ) AS missing
                LEFT JOIN users ON users.id = missing.owner_id
                WHERE missing.owner_id IS NOT NULL AND users.id IS NULL
                """
            )
        )

        for table_name, column_name, fk_name in [
            ("clients", "owner_id", "fk_clients_owner_id_users"),
            ("categories", "owner_id", "fk_categories_owner_id_users"),
            ("oauth_accounts", "owner_id", "fk_oauth_accounts_owner_id_users"),
        ]:
            existing_fks = {fk["name"] for fk in inspector.get_foreign_keys(table_name) if fk.get("name")}
            if fk_name in existing_fks:
                continue
            with op.batch_alter_table(table_name) as batch_op:
                batch_op.create_foreign_key(fk_name, "users", [column_name], ["id"])


def downgrade() -> None:
    connection = op.get_bind()
    inspector = sa.inspect(connection)

    for table_name, fk_name in [
        ("oauth_accounts", "fk_oauth_accounts_owner_id_users"),
        ("categories", "fk_categories_owner_id_users"),
        ("clients", "fk_clients_owner_id_users"),
    ]:
        if table_name not in inspector.get_table_names():
            continue
        existing_fks = {fk["name"] for fk in inspector.get_foreign_keys(table_name) if fk.get("name")}
        if fk_name not in existing_fks:
            continue
        with op.batch_alter_table(table_name) as batch_op:
            batch_op.drop_constraint(fk_name, type_="foreignkey")

    if "user_profiles" not in inspector.get_table_names():
        return

    existing_indexes = {index["name"] for index in inspector.get_indexes("user_profiles")}
    if op.f("ix_user_profiles_user_id") in existing_indexes:
        op.drop_index(op.f("ix_user_profiles_user_id"), table_name="user_profiles")
    op.drop_table("user_profiles")
