from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

TIPOS_VALIDOS = {"pedido", "envio"}


class PlantillaCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=200)
    tipo: str
    asunto: str = Field(min_length=1, max_length=500)
    cuerpo: str = Field(min_length=1)

    @field_validator("tipo")
    @classmethod
    def validate_tipo(cls, v: str) -> str:
        if v not in TIPOS_VALIDOS:
            raise ValueError("tipo debe ser 'pedido' o 'envio'")
        return v


class PlantillaUpdate(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=200)
    tipo: Optional[str] = None
    asunto: Optional[str] = Field(default=None, min_length=1, max_length=500)
    cuerpo: Optional[str] = Field(default=None, min_length=1)

    @field_validator("tipo")
    @classmethod
    def validate_tipo(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in TIPOS_VALIDOS:
            raise ValueError("tipo debe ser 'pedido' o 'envio'")
        return v


class PlantillaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    nombre: str
    tipo: str
    asunto: str
    cuerpo: str
    created_at: datetime

    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid(cls, v):
        return str(v) if v is not None else v
