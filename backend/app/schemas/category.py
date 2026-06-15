from pydantic import BaseModel

from app.schemas.common import TimestampResponse


class CategoryBase(BaseModel):
    name: str
    description: str | None = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class CategoryRead(TimestampResponse, CategoryBase):
    owner_id: str

