from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class ProveedorCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=200)
    email: Optional[EmailStr] = None
    cuit: Optional[str] = Field(default=None, max_length=20)
    notas: Optional[str] = None


class ProveedorUpdate(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=200)
    email: Optional[EmailStr] = None
    cuit: Optional[str] = Field(default=None, max_length=20)
    notas: Optional[str] = None


class ProveedorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    nombre: str
    email: Optional[str]
    cuit: Optional[str]
    notas: Optional[str]
    created_at: datetime

    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid(cls, v):
        return str(v) if v is not None else v
