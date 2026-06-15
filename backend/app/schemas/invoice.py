from datetime import date

from pydantic import BaseModel

from app.schemas.common import TimestampResponse


class AddressValue(BaseModel):
    line_1: str | None = None
    line_2: str | None = None
    city: str | None = None
    state: str | None = None
    postal_code: str | None = None
    country: str | None = None
    full_address: str | None = None


class InvoiceParty(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    tax_id: str | None = None
    logo_url: str | None = None
    address: AddressValue | None = None


class InvoicePartyDetails(BaseModel):
    from_: InvoiceParty | None = None
    to: InvoiceParty | None = None

    model_config = {"populate_by_name": True}


class InvoiceBase(BaseModel):
    client_id: str
    invoice_number: str
    title: str
    total_amount: float
    due_date: date | None = None
    status: str = "draft"
    notes: str | None = None
    party_details: dict | None = None
    template_snapshot: dict | None = None
    pdf_file_path: str | None = None
    pdf_file_name: str | None = None


class InvoiceCreate(InvoiceBase):
    pass


class InvoiceUpdate(BaseModel):
    invoice_number: str | None = None
    title: str | None = None
    total_amount: float | None = None
    due_date: date | None = None
    status: str | None = None
    notes: str | None = None
    party_details: dict | None = None
    template_snapshot: dict | None = None
    pdf_file_path: str | None = None
    pdf_file_name: str | None = None


class InvoiceRead(TimestampResponse, InvoiceBase):
    user_id: str


class InvoiceDraftResponse(BaseModel):
    success: bool = True
    message: str
    attachment_summary: str | None = None
    status: str | None = None
    provider: str | None = None
