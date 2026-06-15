"""refactor uploaded bill files to bill relation

Revision ID: 20260407_000008
Revises: 20260407_000007
Create Date: 2026-04-07 15:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260407_000008"
down_revision: Union[str, None] = "20260407_000007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("uploaded_bill_files")}
    indexes = {index["name"] for index in inspector.get_indexes("uploaded_bill_files")}
    foreign_keys = {fk["name"] for fk in inspector.get_foreign_keys("uploaded_bill_files") if fk.get("name")}

    if "bill_id" not in columns:
        op.add_column("uploaded_bill_files", sa.Column("bill_id", sa.String(), nullable=True))
        op.execute(
            sa.text(
                """
                UPDATE uploaded_bill_files ubf
                SET bill_id = bills.id
                FROM bills
                WHERE bills.file_path IS NOT NULL
                  AND bills.file_path = ubf.file_path
                  AND ubf.bill_id IS NULL
                """
            )
        )

    if "fk_uploaded_bill_files_bill_id_bills" not in foreign_keys:
        op.create_foreign_key(
            "fk_uploaded_bill_files_bill_id_bills",
            "uploaded_bill_files",
            "bills",
            ["bill_id"],
            ["id"],
        )

    if "ix_uploaded_bill_files_bill_id" not in indexes:
        op.create_index("ix_uploaded_bill_files_bill_id", "uploaded_bill_files", ["bill_id"], unique=True)

    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("uploaded_bill_files")}
    foreign_keys = {fk["name"] for fk in inspector.get_foreign_keys("uploaded_bill_files") if fk.get("name")}
    indexes = {index["name"] for index in inspector.get_indexes("uploaded_bill_files")}

    if "fk_uploaded_bill_files_invoice_id_invoices" in foreign_keys:
        op.drop_constraint("fk_uploaded_bill_files_invoice_id_invoices", "uploaded_bill_files", type_="foreignkey")
    if "ix_uploaded_bill_files_invoice_id" in indexes:
        op.drop_index("ix_uploaded_bill_files_invoice_id", table_name="uploaded_bill_files")
    if "invoice_id" in columns:
        op.drop_column("uploaded_bill_files", "invoice_id")

    if "chat_id" in columns:
        fk_name = next((name for name in foreign_keys if name and "chat_id" in name), None)
        if fk_name:
            op.drop_constraint(fk_name, "uploaded_bill_files", type_="foreignkey")
        chat_indexes = {index["name"] for index in sa.inspect(bind).get_indexes("uploaded_bill_files")}
        if "ix_uploaded_bill_files_chat_id" in chat_indexes:
            op.drop_index("ix_uploaded_bill_files_chat_id", table_name="uploaded_bill_files")
        op.drop_column("uploaded_bill_files", "chat_id")

    if "client_id" in columns:
        fk_name = next((name for name in foreign_keys if name and "client_id" in name), None)
        if fk_name:
            op.drop_constraint(fk_name, "uploaded_bill_files", type_="foreignkey")
        client_indexes = {index["name"] for index in sa.inspect(bind).get_indexes("uploaded_bill_files")}
        if "ix_uploaded_bill_files_client_id" in client_indexes:
            op.drop_index("ix_uploaded_bill_files_client_id", table_name="uploaded_bill_files")
        op.drop_column("uploaded_bill_files", "client_id")

    if "owner_id" in columns:
        owner_indexes = {index["name"] for index in sa.inspect(bind).get_indexes("uploaded_bill_files")}
        if "ix_uploaded_bill_files_owner_id" in owner_indexes:
            op.drop_index("ix_uploaded_bill_files_owner_id", table_name="uploaded_bill_files")
        op.drop_column("uploaded_bill_files", "owner_id")


def downgrade() -> None:
    pass
