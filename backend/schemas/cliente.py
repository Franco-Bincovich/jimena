from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ClienteCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=200)
    email: Optional[str] = None
    cuit: Optional[str] = Field(default=None, max_length=20)
    telefono: Optional[str] = Field(default=None, max_length=50)
    notas: Optional[str] = None

    @field_validator('email', mode='before')
    @classmethod
    def email_vacio_a_none(cls, v):
        if v == "" or v is None:
            return None
        return v


class ClienteUpdate(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=200)
    email: Optional[str] = None
    cuit: Optional[str] = Field(default=None, max_length=20)
    telefono: Optional[str] = Field(default=None, max_length=50)
    notas: Optional[str] = None

    @field_validator('email', mode='before')
    @classmethod
    def email_vacio_a_none(cls, v):
        if v == "" or v is None:
            return None
        return v


class ClienteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, json_encoders={UUID: str})

    id: UUID
    nombre: str
    email: Optional[str]
    cuit: Optional[str]
    telefono: Optional[str]
    notas: Optional[str]
    created_at: datetime
