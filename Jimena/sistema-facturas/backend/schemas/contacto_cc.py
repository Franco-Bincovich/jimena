from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class ContactoCCCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=200)
    email: EmailStr


class ContactoCCResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    nombre: str
    email: str
    created_at: datetime

    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid(cls, v):
        return str(v) if v is not None else v
