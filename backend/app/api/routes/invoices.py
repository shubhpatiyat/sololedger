from pathlib import Path

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse

from app.api.deps import AuthUser, DBSession
from app.models.client import Client
from app.models.invoice import Invoice
from app.models.invoice_template import InvoiceTemplate
from app.models.user import User
from app.models.user_profile import UserProfile
from app.schemas.invoice import InvoiceCreate, InvoiceDraftResponse, InvoiceRead, InvoiceUpdate
from app.services.email_drafts import regenerate_invoice_email_draft
from app.services.invoice_pdf import generate_invoice_pdf
from app.services.invoice_rendering import build_invoice_pdf_payload

router = APIRouter()


def _build_party_details(current_user: AuthUser, client: Client, user: User | None, profile: UserProfile | None) -> dict:
    display_name = " ".join(
        part for part in [user.first_name if user else None, user.last_name if user else None] if part
    ).strip()
    from_name = (profile.name if profile and profile.name else None) or display_name or current_user.email
    client_address_parts = [
        client.address_line_1,
        client.address_line_2,
        client.city,
        client.state,
        client.postal_code,
        client.country,
    ]
    client_full_address = ", ".join(part.strip() for part in client_address_parts if part and part.strip()) or None

    return {
        "from": {
            "name": from_name,
            "email": current_user.email or (user.email if user else None),
            "phone": None,
            "tax_id": None,
            "logo_url": None,
            "address": {
                "full_address": profile.address if profile else None,
                "postal_code": profile.pincode if profile else None,
            },
        },
        "to": {
            "name": client.name,
            "email": client.email,
            "phone": client.phone,
            "tax_id": None,
            "address": {
                "line_1": client.address_line_1,
                "line_2": client.address_line_2,
                "city": client.city,
                "state": client.state,
                "postal_code": client.postal_code,
                "country": client.country,
                "full_address": client_full_address,
            },
        },
    }


@router.get("", response_model=list[InvoiceRead])
def list_invoices(db: DBSession, current_user: AuthUser):
    return (
        db.query(Invoice)
        .join(Client, Invoice.client_id == Client.id)
        .filter(Client.owner_id == current_user.id)
        .order_by(Invoice.created_at.desc())
        .all()
    )


@router.post("", response_model=InvoiceRead, status_code=status.HTTP_201_CREATED)
def create_invoice(payload: InvoiceCreate, db: DBSession, current_user: AuthUser):
    client = db.query(Client).filter(Client.id == payload.client_id, Client.owner_id == current_user.id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    user = db.query(User).filter(User.id == current_user.id).first()
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    invoice_data = payload.model_dump()
    if invoice_data.get("template_snapshot") is None:
        default_template = (
            db.query(InvoiceTemplate)
            .filter(InvoiceTemplate.user_id == current_user.id, InvoiceTemplate.is_default.is_(True))
            .first()
        )
        invoice_data["template_snapshot"] = default_template.template_json if default_template else None

    invoice_data["user_id"] = current_user.id
    invoice_data["party_details"] = invoice_data.get("party_details") or _build_party_details(
        current_user=current_user,
        client=client,
        user=user,
        profile=profile,
    )
    invoice = Invoice(**invoice_data)
    db.add(invoice)
    db.flush()
    pdf_path, pdf_name = generate_invoice_pdf(invoice)
    invoice.pdf_file_path = pdf_path
    invoice.pdf_file_name = pdf_name
    db.commit()
    db.refresh(invoice)
    return invoice


@router.patch("/{invoice_id}", response_model=InvoiceRead)
def update_invoice(invoice_id: str, payload: InvoiceUpdate, db: DBSession, current_user: AuthUser):
    invoice = (
        db.query(Invoice)
        .join(Client, Invoice.client_id == Client.id)
        .filter(Invoice.id == invoice_id, Client.owner_id == current_user.id)
        .first()
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(invoice, field, value)

    db.commit()
    db.refresh(invoice)
    return invoice


@router.post("/{invoice_id}/regenerate-email-draft", response_model=InvoiceDraftResponse)
def regenerate_email_draft(invoice_id: str, db: DBSession, current_user: AuthUser):
    invoice = (
        db.query(Invoice)
        .join(Client, Invoice.client_id == Client.id)
        .filter(Invoice.id == invoice_id, Client.owner_id == current_user.id)
        .first()
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    client = db.query(Client).filter(Client.id == invoice.client_id, Client.owner_id == current_user.id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Rebuild PDF so latest party details (including client address) are reflected in the attachment.
    pdf_path, pdf_name = generate_invoice_pdf(invoice)
    invoice.pdf_file_path = pdf_path
    invoice.pdf_file_name = pdf_name
    db.flush()

    email_draft = regenerate_invoice_email_draft(
        db,
        owner_id=current_user.id,
        client=client,
        invoice=invoice,
    )
    db.commit()

    if email_draft is None:
        return InvoiceDraftResponse(
            message="Invoice draft was not created because the client email is missing.",
            attachment_summary=None,
            status=None,
            provider=None,
        )

    if email_draft.status == "provider_draft_created":
        response_message = "Invoice email draft regenerated successfully."
    elif email_draft.status == "chat_ready":
        response_message = "Mail is not connected. Invoice PDF is ready to share in chat."
    elif email_draft.status == "provider_error":
        response_message = (
            "Invoice email could not be prepared or sent."
            f" {email_draft.error_message or 'Unknown provider error.'}"
        )
    else:
        response_message = "Invoice email was prepared."

    return InvoiceDraftResponse(
        message=response_message,
        attachment_summary=email_draft.attachment_summary,
        status=email_draft.status,
        provider=email_draft.provider,
    )


@router.get("/{invoice_id}/file", name="get_invoice_file")
def get_invoice_file(invoice_id: str, db: DBSession, current_user: AuthUser):
    invoice = (
        db.query(Invoice)
        .join(Client, Invoice.client_id == Client.id)
        .filter(Invoice.id == invoice_id, Client.owner_id == current_user.id)
        .first()
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if not invoice.pdf_file_path:
        raise HTTPException(status_code=404, detail="Invoice PDF not found")

    file_path = Path(invoice.pdf_file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Invoice PDF file missing")

    file_name = invoice.pdf_file_name or f"{invoice.invoice_number}.pdf"
    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=file_name,
        content_disposition_type="attachment",
    )


@router.get("/{invoice_id}/pdf-payload")
def get_invoice_pdf_payload(invoice_id: str, db: DBSession, current_user: AuthUser):
    invoice = (
        db.query(Invoice)
        .join(Client, Invoice.client_id == Client.id)
        .filter(Invoice.id == invoice_id, Client.owner_id == current_user.id)
        .first()
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    return build_invoice_pdf_payload(invoice)
