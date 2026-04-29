from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ContactoCCCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=200)
    email: EmailStr


class ContactoCCResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    nombre: str
    email: str
    created_at: datetime
