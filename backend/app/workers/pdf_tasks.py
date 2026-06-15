from app.services.pdf_service import generate_for_invoice


def generate_invoice_pdf_task(invoice):
    return generate_for_invoice(invoice)
