import re
from calendar import month_name
from datetime import date, datetime, timedelta
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.bill import Bill
from app.models.client import Client
from app.models.invoice import Invoice
from app.models.user import User
from app.models.user_profile import UserProfile
from app.repositories.bill_repository import list_uninvoiced_by_client
from app.repositories.invoice_repository import create_invoice
from app.services.email_drafts import load_invoice_attachments
from app.services.email_service import prepare_invoice_draft, render_draft_status
from app.services.llm.decision_service import extract_invoice_decision
from app.services.pdf_service import generate_for_invoice


def _finance_ui(payload: dict, guidance: str | None = None) -> str:
    import json

    parts = [f"<finance-ui>{json.dumps(payload)}</finance-ui>"]
    if guidance:
        parts.append(guidance)
    return "\n\n".join(parts)


def _normalize_text(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", value).strip()


def _build_invoice_number() -> str:
    return f"INV-{uuid4().hex[:8].upper()}"


def _bill_effective_date(bill: Bill) -> date:
    if bill.bill_date is not None:
        return bill.bill_date
    created_at = bill.created_at
    if isinstance(created_at, datetime):
        return created_at.date()
    return date.today()


def _format_month_year(month: int, year: int) -> str:
    return f"{month_name[month]} {year}"


def _invoice_file_path(invoice_id: str) -> str:
    return f"/api/v1/invoices/{invoice_id}/file"


def extract_month_year_from_text(user_message: str) -> tuple[int | None, int | None]:
    normalized = _normalize_text(user_message).lower()
    month_lookup = {month.lower(): index for index, month in enumerate(month_name) if month}

    detected_month = None
    for month, index in month_lookup.items():
        if re.search(rf"\b{month}\b", normalized):
            detected_month = index
            break

    year_match = re.search(r"\b(20\d{2})\b", normalized)
    detected_year = int(year_match.group(1)) if year_match else None
    return detected_month, detected_year


def build_invoice_party_details(client: Client, user: User | None, profile: UserProfile | None) -> dict:
    display_name = " ".join(
        part for part in [user.first_name if user else None, user.last_name if user else None] if part
    ).strip()
    from_name = (profile.name if profile and profile.name else None) or display_name or (user.email if user else None)

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
            "email": user.email if user else None,
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


def _create_invoice_record(
    db: Session,
    *,
    client: Client,
    title: str,
    total_amount: float,
    notes: str,
) -> Invoice:
    user = db.query(User).filter(User.id == client.owner_id).first()
    profile = db.query(UserProfile).filter(UserProfile.user_id == client.owner_id).first()

    invoice = Invoice(
        user_id=client.owner_id,
        client_id=client.id,
        invoice_number=_build_invoice_number(),
        title=title,
        total_amount=total_amount,
        due_date=date.today() + timedelta(days=7),
        status="draft",
        notes=notes,
        party_details=build_invoice_party_details(client=client, user=user, profile=profile),
    )
    create_invoice(db, invoice)

    pdf_path, pdf_name = generate_for_invoice(invoice)
    invoice.pdf_file_path = pdf_path
    invoice.pdf_file_name = pdf_name
    return invoice


def create_invoice_for_bill(db: Session, *, client: Client, bill: Bill) -> Invoice:
    invoice = _create_invoice_record(
        db,
        client=client,
        title=bill.title,
        total_amount=bill.amount,
        notes=f"Generated from expense bill {bill.id}.",
    )
    bill.invoice_id = invoice.id
    return invoice


def create_invoice_for_bills(
    db: Session,
    *,
    client: Client,
    bills: list[Bill],
    month: int,
    year: int,
    title: str | None = None,
) -> Invoice:
    period = _format_month_year(month, year)
    invoice = _create_invoice_record(
        db,
        client=client,
        title=title or f"Invoice for {client.name} - {period}",
        total_amount=sum(bill.amount for bill in bills),
        notes=f"Generated from {len(bills)} uninvoiced bill(s) for {period}.",
    )
    for bill in bills:
        bill.invoice_id = invoice.id
    return invoice


def handle_invoice_creation(
    db: Session,
    *,
    client: Client,
    owner_id: str,
    user_message: str,
) -> str | None:
    month, year = extract_month_year_from_text(user_message)
    decision = extract_invoice_decision(client, user_message)

    if month is None:
        month = decision.month
    if year is None:
        year = decision.year

    if month is None:
        return None
    if year is None:
        year = date.today().year

    bills = list_uninvoiced_by_client(db, client_id=client.id)
    matching_bills = [
        bill
        for bill in bills
        if (effective_date := _bill_effective_date(bill)).month == month and effective_date.year == year
    ]

    if not matching_bills:
        period = _format_month_year(month, year)
        return _finance_ui(
            {
                "type": "empty-state",
                "title": "No uninvoiced bills found",
                "subtitle": period,
                "client_name": client.name,
            },
            f"No uninvoiced bills were found for {period} for {client.name}.",
        )

    invoice = create_invoice_for_bills(
        db,
        client=client,
        bills=matching_bills,
        month=month,
        year=year,
        title=decision.title,
    )
    uploaded_files = load_invoice_attachments(db, invoice_id=invoice.id)
    email_draft = prepare_invoice_draft(
        db,
        owner_id=owner_id,
        client=client,
        invoice=invoice,
        attachments=uploaded_files,
    )
    email_status = render_draft_status(client, email_draft)
    period = _format_month_year(month, year)
    payload: dict = {
        "type": "invoice-created",
        "invoice_number": invoice.invoice_number,
        "title": invoice.title,
        "total_amount": invoice.total_amount,
        "bill_count": len(matching_bills),
        "period": period,
        "status": invoice.status,
    }
    guidance = (
        f"Invoice {invoice.invoice_number} was created for {period} with {len(matching_bills)} bill(s) totaling "
        f"{invoice.total_amount:g}.{email_status}"
    )
    if email_draft and email_draft.status == "chat_ready":
        file_name = invoice.pdf_file_name or f"{invoice.invoice_number}.pdf"
        file_url = _invoice_file_path(invoice.id)
        payload["file_name"] = file_name
        payload["file_url"] = file_url
        guidance = (
            f"Invoice {invoice.invoice_number} was created for {period} with {len(matching_bills)} bill(s) totaling "
            f"{invoice.total_amount:g}. Here is your invoice: [{file_name}]({file_url})."
        )

    return _finance_ui(
        payload,
        guidance,
    )
