from sqlalchemy.orm import Session

from app.models.client import Client
from app.services.invoice_service import create_invoice_for_bills


def create_invoice_for_month_task(
    db: Session,
    *,
    client: Client,
    bills,
    month: int,
    year: int,
    title: str | None = None,
):
    return create_invoice_for_bills(db, client=client, bills=bills, month=month, year=year, title=title)
