from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


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
    model_config = ConfigDict(from_attributes=True, json_encoders={UUID: str})

    id: UUID
    nombre: str
    email: Optional[str]
    cuit: Optional[str]
    notas: Optional[str]
    created_at: datetime
