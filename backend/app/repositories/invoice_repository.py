from sqlalchemy.orm import Session

from app.models.invoice import Invoice


def create_invoice(db: Session, invoice: Invoice) -> Invoice:
    db.add(invoice)
    db.flush()
    return invoice
