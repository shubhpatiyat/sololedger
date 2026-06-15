from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ORMBaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class TimestampResponse(ORMBaseSchema):
    id: str
    created_at: datetime
    updated_at: datetime

