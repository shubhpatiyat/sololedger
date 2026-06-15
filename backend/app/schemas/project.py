from pydantic import BaseModel

from app.schemas.common import TimestampResponse


class ProjectBase(BaseModel):
    client_id: str
    name: str
    description: str | None = None
    status: str = "active"
    budget_amount: float | None = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None
    budget_amount: float | None = None


class ProjectRead(TimestampResponse, ProjectBase):
    pass


class EndUserProfileRead(BaseModel):
    email: str
    first_name: str
    last_name: str
    profile_image_url: str | None = None
    is_gmail_connected: bool = False
    is_outlook_connected: bool = False
    gmail_account_email: str | None = None
    outlook_account_email: str | None = None
    address: str | None = None
    pincode: str | None = None


class EndUserProfileResponse(BaseModel):
    success: bool = True
    profile: EndUserProfileRead
