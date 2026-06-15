from pydantic import BaseModel, Field

from app.schemas.common import TimestampResponse


class InvoiceTemplateBase(BaseModel):
    name: str = "Default"
    is_default: bool = True
    template_json: dict = Field(default_factory=dict)


class InvoiceTemplateUpsert(BaseModel):
    name: str = "Default"
    template_json: dict = Field(default_factory=dict)


class InvoiceTemplateRead(TimestampResponse, InvoiceTemplateBase):
    user_id: str
