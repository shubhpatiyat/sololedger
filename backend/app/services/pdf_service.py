from app.models.invoice import Invoice
from app.services.invoice_pdf import generate_invoice_pdf


def generate_for_invoice(invoice: Invoice) -> tuple[str, str]:
    return generate_invoice_pdf(invoice)
