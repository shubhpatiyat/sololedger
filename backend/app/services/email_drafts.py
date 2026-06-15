from sqlalchemy.orm import Session

from app.models.client import Client
from app.models.bill import Bill
from app.models.email_draft import EmailDraft
from app.models.invoice import Invoice
from app.models.oauth_account import OAuthAccount
from app.models.uploaded_bill_file import UploadedBillFile
from app.services.invoice_pdf import EmailAttachmentFile
from app.services.mail_providers import (
    OAuthProviderError,
    create_gmail_draft,
    create_outlook_draft,
    ensure_valid_access_token,
)


def _build_attachment_summary(attachments: list[UploadedBillFile | EmailAttachmentFile]) -> str | None:
    if not attachments:
        return None
    return ", ".join(upload.original_file_name for upload in attachments)


def _build_subject(invoice: Invoice) -> str:
    return f"Invoice {invoice.invoice_number}"


def _build_body(client: Client, invoice: Invoice, attachments: list[UploadedBillFile | EmailAttachmentFile]) -> str:
    due_date_text = invoice.due_date.isoformat() if invoice.due_date else "N/A"
    attachment_line = ""
    if attachments:
        attachment_line = (
            "\nAttached supporting files: "
            + ", ".join(upload.original_file_name for upload in attachments)
            + "."
        )
    return (
        f"Hi {client.name},\n\n"
        f"Please find invoice {invoice.invoice_number} for {invoice.title}.\n"
        f"Total amount: {invoice.total_amount:g}\n"
        f"Due date: {due_date_text}\n"
        f"{attachment_line}\n\n"
        "Thanks."
    ).strip()


def get_default_oauth_account(db: Session, owner_id: str) -> OAuthAccount | None:
    return (
        db.query(OAuthAccount)
        .filter(
            OAuthAccount.owner_id == owner_id,
            OAuthAccount.status == "connected",
        )
        .order_by(OAuthAccount.is_default_for_invoicing.desc(), OAuthAccount.updated_at.desc())
        .first()
    )


def prepare_invoice_email_draft(
    db: Session,
    *,
    owner_id: str,
    client: Client,
    invoice: Invoice,
    attachments: list[UploadedBillFile | EmailAttachmentFile],
) -> EmailDraft | None:
    if not client.email:
        return None

    oauth_account = get_default_oauth_account(db, owner_id)
    draft = EmailDraft(
        owner_id=owner_id,
        client_id=client.id,
        invoice_id=invoice.id,
        oauth_account_id=oauth_account.id if oauth_account else None,
        provider=oauth_account.provider if oauth_account else None,
        recipient_email=client.email,
        subject=_build_subject(invoice),
        body=_build_body(client, invoice, attachments),
        attachment_summary=_build_attachment_summary(attachments),
        status="prepared" if oauth_account else "chat_ready",
        error_message=None,
    )
    db.add(draft)
    db.flush()
    if not oauth_account:
        return draft

    try:
        access_token = ensure_valid_access_token(oauth_account)
        if oauth_account.provider == "gmail":
            provider_draft_id = create_gmail_draft(
                access_token=access_token,
                recipient_email=draft.recipient_email,
                subject=draft.subject,
                body=draft.body,
                attachments=attachments,
            )
        elif oauth_account.provider == "outlook":
            provider_draft_id = create_outlook_draft(
                access_token=access_token,
                recipient_email=draft.recipient_email,
                subject=draft.subject,
                body=draft.body,
                attachments=attachments,
            )
        else:
            raise OAuthProviderError(f"Unsupported mail provider: {oauth_account.provider}")
    except OAuthProviderError as exc:
        draft.status = "provider_error"
        draft.error_message = str(exc)
        oauth_account.status = "error"
        oauth_account.last_error = str(exc)
        db.flush()
        return draft

    draft.provider_draft_id = provider_draft_id
    draft.status = "provider_draft_created"
    draft.error_message = None
    oauth_account.status = "connected"
    oauth_account.last_error = None
    db.flush()
    return draft


def load_invoice_attachments(
    db: Session,
    *,
    bill_id: str | None = None,
    invoice_id: str | None = None,
) -> list[UploadedBillFile | EmailAttachmentFile]:
    attachments: list[UploadedBillFile | EmailAttachmentFile] = []
    if invoice_id:
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if invoice and invoice.pdf_file_path:
            attachments.append(
                EmailAttachmentFile(
                    original_file_name=invoice.pdf_file_name or f"{invoice.invoice_number}.pdf",
                    file_path=invoice.pdf_file_path,
                    content_type="application/pdf",
                )
            )

    query = db.query(UploadedBillFile).join(Bill, UploadedBillFile.bill_id == Bill.id)
    if invoice_id:
        # Invoice draft order should always be:
        # 1) invoice PDF (handled above), then 2) all invoice bill files one by one.
        query = query.filter(Bill.invoice_id == invoice_id)
    elif bill_id:
        query = query.filter(Bill.id == bill_id)
    else:
        return attachments

    bill_attachments = query.order_by(Bill.created_at.asc(), UploadedBillFile.created_at.asc()).all()
    return attachments + bill_attachments


def regenerate_invoice_email_draft(
    db: Session,
    *,
    owner_id: str,
    client: Client,
    invoice: Invoice,
) -> EmailDraft | None:
    existing_drafts = db.query(EmailDraft).filter(EmailDraft.invoice_id == invoice.id).all()
    for existing_draft in existing_drafts:
        db.delete(existing_draft)
    db.flush()

    attachments = load_invoice_attachments(db, invoice_id=invoice.id)
    return prepare_invoice_email_draft(
        db,
        owner_id=owner_id,
        client=client,
        invoice=invoice,
        attachments=attachments,
    )
