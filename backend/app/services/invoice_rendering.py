from datetime import date

from app.models.bill import Bill
from app.models.invoice import Invoice


def _compose_full_address(address: dict | None) -> str | None:
    if not isinstance(address, dict):
        return None

    full_address = str(address.get("full_address") or "").strip()
    if full_address:
        return full_address

    parts = [
        address.get("line_1"),
        address.get("line_2"),
        address.get("city"),
        address.get("state"),
        address.get("postal_code"),
        address.get("country"),
    ]
    rendered = ", ".join(str(part).strip() for part in parts if part and str(part).strip())
    return rendered or None


def build_invoice_pdf_payload(invoice: Invoice) -> dict:
    bill_titles = [bill.title for bill in invoice.bills if bill.title]
    description = ", ".join(bill_titles) if bill_titles else invoice.title

    template_snapshot = dict(invoice.template_snapshot or {})
    layout = dict(template_snapshot.get("layout") or {})
    show_fields = dict(layout.get("show_fields") or {})
    show_fields["payment_details"] = False
    layout["show_fields"] = show_fields
    template_snapshot["layout"] = layout
    party_details = dict(invoice.party_details or {})
    bill_to = dict(party_details.get("to") or {})
    from_party = dict(party_details.get("from") or {})

    # Fallback to live client data when legacy invoices have empty or partial party_details.
    if invoice.client:
        bill_to.setdefault("name", invoice.client.name)
        bill_to.setdefault("email", invoice.client.email)
        bill_to.setdefault("phone", invoice.client.phone)
        to_address = dict(bill_to.get("address") or {})
        to_address.setdefault("line_1", invoice.client.address_line_1)
        to_address.setdefault("line_2", invoice.client.address_line_2)
        to_address.setdefault("city", invoice.client.city)
        to_address.setdefault("state", invoice.client.state)
        to_address.setdefault("postal_code", invoice.client.postal_code)
        to_address.setdefault("country", invoice.client.country)
        full_address = _compose_full_address(to_address)
        if full_address:
            to_address.setdefault("full_address", full_address)
        bill_to["address"] = to_address if any(value for value in to_address.values()) else None

    if invoice.user and invoice.user.profile:
        from_address = dict(from_party.get("address") or {})
        from_address.setdefault("full_address", invoice.user.profile.address)
        from_address.setdefault("postal_code", invoice.user.profile.pincode)
        full_address = _compose_full_address(from_address)
        if full_address:
            from_address.setdefault("full_address", full_address)
        from_party["address"] = from_address if any(value for value in from_address.values()) else None

    return {
        "invoice_id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "invoice_date": (invoice.created_at.date() if invoice.created_at else date.today()).isoformat(),
        "bill_to": bill_to,
        "from": from_party,
        "balance_due": invoice.total_amount,
        "description": description,
        "line_items": [
            {
                "bill_id": bill.id,
                "title": bill.title,
                "amount": bill.amount,
                "bill_date": bill.bill_date.isoformat() if bill.bill_date else None,
            }
            for bill in invoice.bills
        ],
        "template_snapshot": template_snapshot,
    }
