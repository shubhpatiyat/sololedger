"""add oauth accounts and email drafts

Revision ID: 20260406_000005
Revises: 20260406_000004
Create Date: 2026-04-06 22:25:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260406_000005"
down_revision: Union[str, None] = "20260406_000004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "oauth_accounts",
        sa.Column("owner_id", sa.String(length=255), nullable=False),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("account_email", sa.String(length=255), nullable=True),
        sa.Column("access_token", sa.Text(), nullable=True),
        sa.Column("refresh_token", sa.Text(), nullable=True),
        sa.Column("token_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("scope", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("is_default_for_invoicing", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("owner_id", "provider", name="uq_oauth_accounts_owner_provider"),
    )
    op.create_index(op.f("ix_oauth_accounts_owner_id"), "oauth_accounts", ["owner_id"], unique=False)

    op.create_table(
        "email_drafts",
        sa.Column("owner_id", sa.String(length=255), nullable=False),
        sa.Column("client_id", sa.String(), nullable=False),
        sa.Column("invoice_id", sa.String(), nullable=False),
        sa.Column("oauth_account_id", sa.String(), nullable=True),
        sa.Column("provider", sa.String(length=50), nullable=True),
        sa.Column("recipient_email", sa.String(length=255), nullable=False),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("attachment_summary", sa.Text(), nullable=True),
        sa.Column("provider_draft_id", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"]),
        sa.ForeignKeyConstraint(["invoice_id"], ["invoices.id"]),
        sa.ForeignKeyConstraint(["oauth_account_id"], ["oauth_accounts.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_email_drafts_owner_id"), "email_drafts", ["owner_id"], unique=False)
    op.create_index(op.f("ix_email_drafts_client_id"), "email_drafts", ["client_id"], unique=False)
    op.create_index(op.f("ix_email_drafts_invoice_id"), "email_drafts", ["invoice_id"], unique=False)
    op.create_index(op.f("ix_email_drafts_oauth_account_id"), "email_drafts", ["oauth_account_id"], unique=False)

    op.add_column("uploaded_bill_files", sa.Column("invoice_id", sa.String(), nullable=True))
    op.create_foreign_key(
        "fk_uploaded_bill_files_invoice_id_invoices",
        "uploaded_bill_files",
        "invoices",
        ["invoice_id"],
        ["id"],
    )
    op.create_index(
        op.f("ix_uploaded_bill_files_invoice_id"),
        "uploaded_bill_files",
        ["invoice_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_uploaded_bill_files_invoice_id"), table_name="uploaded_bill_files")
    op.drop_constraint("fk_uploaded_bill_files_invoice_id_invoices", "uploaded_bill_files", type_="foreignkey")
    op.drop_column("uploaded_bill_files", "invoice_id")

    op.drop_index(op.f("ix_email_drafts_oauth_account_id"), table_name="email_drafts")
    op.drop_index(op.f("ix_email_drafts_invoice_id"), table_name="email_drafts")
    op.drop_index(op.f("ix_email_drafts_client_id"), table_name="email_drafts")
    op.drop_index(op.f("ix_email_drafts_owner_id"), table_name="email_drafts")
    op.drop_table("email_drafts")

    op.drop_index(op.f("ix_oauth_accounts_owner_id"), table_name="oauth_accounts")
    op.drop_table("oauth_accounts")
