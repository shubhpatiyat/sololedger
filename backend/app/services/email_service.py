from app.models.client import Client
from app.models.email_draft import EmailDraft
from app.services.email_drafts import prepare_invoice_email_draft


def prepare_invoice_draft(
    db,
    *,
    owner_id: str,
    client: Client,
    invoice,
    attachments,
) -> EmailDraft | None:
    return prepare_invoice_email_draft(
        db,
        owner_id=owner_id,
        client=client,
        invoice=invoice,
        attachments=attachments,
    )


def render_draft_status(client: Client, email_draft: EmailDraft | None) -> str:
    if not client.email:
        return " Client email is missing, so no email draft was prepared."
    if email_draft is None:
        return " No email draft was prepared."
    if email_draft.status == "provider_draft_created":
        provider_label = email_draft.provider or "connected mailbox"
        return f" Email draft was created in {provider_label}."
    if email_draft.status == "chat_ready":
        return " Mail is not connected, so I shared the invoice in chat as a PDF."
    if email_draft.status == "prepared":
        return " Email draft content was prepared in SoloLedger."
    if email_draft.status == "provider_error":
        return f" Email draft could not be created: {email_draft.error_message or 'provider request failed'}."
    return " Invoice email draft is pending because no Gmail or Outlook account is connected."
