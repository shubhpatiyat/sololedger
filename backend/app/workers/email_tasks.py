from app.services.email_service import prepare_invoice_draft


def prepare_invoice_email_task(db, *, owner_id: str, client, invoice, attachments):
    return prepare_invoice_draft(
        db,
        owner_id=owner_id,
        client=client,
        invoice=invoice,
        attachments=attachments,
    )
