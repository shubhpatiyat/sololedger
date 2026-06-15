from sqlalchemy.orm import Session

from app.models.bill import Bill
from app.models.category import Category
from app.models.client import Client
from app.models.uploaded_bill_file import UploadedBillFile


def create_bill(
    db: Session,
    *,
    client: Client,
    category: Category,
    amount: float,
    title: str,
    source_message: str,
    vendor_name: str | None,
    file_path: str | None = None,
    invoice_id: str | None = None,
    uploaded_file: UploadedBillFile | None = None,
) -> Bill:
    bill = Bill(
        client_id=client.id,
        category_id=category.id,
        invoice_id=invoice_id,
        title=title,
        amount=amount,
        vendor_name=vendor_name,
        file_path=file_path,
        notes=source_message,
        status="captured",
    )
    db.add(bill)
    db.flush()
    if uploaded_file is not None:
        uploaded_file.bill_id = bill.id
        bill.file_path = uploaded_file.file_path
    return bill


def list_uninvoiced_by_client(db: Session, *, client_id: str) -> list[Bill]:
    return (
        db.query(Bill)
        .filter(Bill.client_id == client_id, Bill.invoice_id.is_(None))
        .order_by(Bill.created_at.asc())
        .all()
    )
