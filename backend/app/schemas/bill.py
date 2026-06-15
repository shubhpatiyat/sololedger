from datetime import date

from pydantic import BaseModel

from app.schemas.common import TimestampResponse


class BillBase(BaseModel):
    client_id: str
    project_id: str | None = None
    category_id: str
    invoice_id: str | None = None
    title: str
    amount: float
    bill_date: date | None = None
    vendor_name: str | None = None
    file_path: str | None = None
    status: str = "captured"
    notes: str | None = None


class BillCreate(BillBase):
    pass


class BillUpdate(BaseModel):
    project_id: str | None = None
    category_id: str | None = None
    invoice_id: str | None = None
    title: str | None = None
    amount: float | None = None
    bill_date: date | None = None
    vendor_name: str | None = None
    file_path: str | None = None
    status: str | None = None
    notes: str | None = None


class BillRead(TimestampResponse, BillBase):
    pass
