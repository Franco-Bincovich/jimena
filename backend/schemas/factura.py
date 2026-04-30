from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProveedorSimple(BaseModel):
    id: str
    nombre: str
    email: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid(cls, v):
        return str(v) if v is not None else v


class ClienteSimple(BaseModel):
    id: str
    nombre: str
    cuit: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid(cls, v):
        return str(v) if v is not None else v


class FacturaResponse(BaseModel):
    id: str
    nombre_archivo: str
    numero_factura: Optional[str] = None
    fecha_factura: Optional[datetime] = None
    fecha_desde: Optional[date] = None
    fecha_hasta: Optional[date] = None
    monto_total: Optional[float] = None
    descripcion: Optional[str] = None
    estado: str
    fecha_recepcion: Optional[datetime] = None
    gmail_message_id: Optional[str] = None
    drive_file_id: Optional[str] = None
    drive_url: Optional[str] = None
    nombre_en_drive: Optional[str] = None
    proveedor: Optional[ProveedorSimple] = None
    clientes: List[ClienteSimple] = []

    model_config = ConfigDict(from_attributes=True)

    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid(cls, v):
        return str(v) if v is not None else v


class FacturaConfirmar(BaseModel):
    numero_factura: Optional[str] = Field(default=None, max_length=100)
    fecha_factura: Optional[str] = None  # formato DD/MM/YYYY
    fecha_desde: Optional[str] = None    # formato DD/MM/YYYY
    fecha_hasta: Optional[str] = None    # formato DD/MM/YYYY
    monto_total: Optional[float] = None
    descripcion: Optional[str] = Field(default=None, max_length=1000)
    proveedor_id: Optional[UUID] = None
    cliente_ids: List[UUID] = []
