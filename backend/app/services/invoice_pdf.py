from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
import base64
import mimetypes
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML

from app.core.config import settings
from app.models.invoice import Invoice
from app.services.invoice_rendering import build_invoice_pdf_payload


@dataclass
class EmailAttachmentFile:
    original_file_name: str
    file_path: str
    content_type: str = "application/pdf"


def ensure_invoice_storage_dir() -> Path:
    storage_dir = Path(settings.local_invoice_storage_dir).expanduser().resolve()
    storage_dir.mkdir(parents=True, exist_ok=True)
    return storage_dir


def _format_inr(value: float | int | str | Decimal) -> str:
    amount = Decimal(str(value or 0)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return f"₹{amount:,.2f}"


def _font_css_name(font_family: str | None) -> str:
    if font_family == "serif":
        return "Georgia, 'Times New Roman', serif"
    if font_family == "mono":
        return "'Courier New', Courier, monospace"
    return "Arial, Helvetica, sans-serif"


def _prepare_logo_src(logo_path: str | None, logo_url: str | None) -> str | None:
    if logo_path:
        candidate = Path(logo_path).expanduser()
    elif logo_url:
        if logo_url.startswith("data:") or logo_url.startswith("http://") or logo_url.startswith("https://"):
            return logo_url
        candidate = Path(logo_url).expanduser()
    else:
        return None

    if not candidate.exists() or not candidate.is_file():
        return None

    mime_type = mimetypes.guess_type(candidate.name)[0] or "image/png"
    content = base64.b64encode(candidate.read_bytes()).decode("ascii")
    return f"data:{mime_type};base64,{content}"


def _render_address_text(address: dict | None) -> str:
    if not isinstance(address, dict):
        return "-"

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
    return rendered or "-"


def _apply_pymupdf_final_touches(file_path: Path, invoice: Invoice) -> None:
    try:
        import fitz
    except Exception:
        return

    document = fitz.open(file_path)
    metadata = document.metadata or {}
    metadata.update(
        {
            "title": f"Invoice {invoice.invoice_number}",
            "author": "SoloLedger",
            "subject": "Invoice PDF",
            "creator": "SoloLedger",
            "producer": "WeasyPrint + PyMuPDF",
        }
    )
    document.set_metadata(metadata)

    optimized_path = file_path.with_suffix(".optimized.pdf")
    document.save(optimized_path, garbage=4, deflate=True)
    document.close()
    optimized_path.replace(file_path)


def generate_invoice_pdf(invoice: Invoice) -> tuple[str, str]:
    payload = build_invoice_pdf_payload(invoice)
    owner_id = invoice.user_id
    file_name = f"{invoice.invoice_number}.pdf"
    destination_dir = ensure_invoice_storage_dir() / owner_id
    destination_dir.mkdir(parents=True, exist_ok=True)
    destination = destination_dir / f"{invoice.id}.pdf"

    template = payload.get("template_snapshot") or {}
    branding = template.get("branding") or {}
    layout = template.get("layout") or {}
    show_fields = layout.get("show_fields") or {}
    labels = template.get("labels") or {}
    defaults = template.get("defaults") or {}
    bill_to = payload.get("bill_to") or {}
    from_party = payload.get("from") or {}

    total = Decimal(str(payload.get("balance_due") or 0)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    tax_amount = (total * Decimal("0.18")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    sub_total = (total - tax_amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    env = Environment(
        loader=FileSystemLoader(str(Path(__file__).resolve().parents[1] / "templates")),
        autoescape=select_autoescape(["html", "xml"]),
    )
    item_rows = payload.get("line_items") or []
    if item_rows:
        items = [
            {
                "description": item.get("title") or "-",
                "rate": _format_inr(item.get("amount") or 0),
                "amount": _format_inr(item.get("amount") or 0),
            }
            for item in item_rows
        ]
    else:
        amount = _format_inr(total)
        items = [{"description": payload.get("description") or (invoice.title or "-"), "rate": amount, "amount": amount}]

    html = env.get_template("invoice/base_invoice.html").render(
        brand_color=branding.get("brand_color") or "#2F80ED",
        font_family=_font_css_name(branding.get("font_family")),
        logo_url=_prepare_logo_src(branding.get("logo_path"), branding.get("logo_url")),
        invoice_title=labels.get("invoice_title") or "TAX INVOICE",
        invoice_number=payload.get("invoice_number") or "-",
        from_name=from_party.get("name") or "-",
        from_address=_render_address_text(from_party.get("address")),
        to_name=bill_to.get("name") or "-",
        to_address=_render_address_text(bill_to.get("address")),
        invoice_date=payload.get("invoice_date") or "-",
        balance_label=labels.get("balance_due_label") or "Balance due",
        balance_due=_format_inr(total),
        description=payload.get("description") or (invoice.title or "-"),
        items=items,
        sub_total=_format_inr(sub_total),
        tax_amount=_format_inr(tax_amount),
        tax_label="IGST (18%)",
        total_amount=_format_inr(total),
        show_tax=bool(show_fields.get("tax_breakdown", True)),
        show_notes=bool(show_fields.get("notes", True)),
        payment_details=None,
        notes_text=defaults.get("notes") or invoice.notes or "Thanks for your business.",
    )

    template_dir = Path(__file__).resolve().parents[1] / "templates"
    HTML(string=html, base_url=str(template_dir)).write_pdf(str(destination))
    _apply_pymupdf_final_touches(destination, invoice)
    return str(destination), file_name
