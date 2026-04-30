from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ProveedorSimple(BaseModel):
    id: UUID
    nombre: str
    email: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, json_encoders={UUID: str})


class ClienteSimple(BaseModel):
    id: UUID
    nombre: str
    cuit: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, json_encoders={UUID: str})


class FacturaResponse(BaseModel):
    id: UUID
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

    model_config = ConfigDict(from_attributes=True, json_encoders={UUID: str})


class FacturaConfirmar(BaseModel):
    numero_factura: Optional[str] = Field(default=None, max_length=100)
    fecha_factura: Optional[str] = None  # formato DD/MM/YYYY
    fecha_desde: Optional[str] = None    # formato DD/MM/YYYY
    fecha_hasta: Optional[str] = None    # formato DD/MM/YYYY
    monto_total: Optional[float] = None
    descripcion: Optional[str] = Field(default=None, max_length=1000)
    proveedor_id: Optional[UUID] = None
    cliente_ids: List[UUID] = []
