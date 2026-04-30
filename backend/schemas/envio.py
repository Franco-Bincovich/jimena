from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ClienteEnvioItem(BaseModel):
    cliente_id: UUID
    monto: Optional[float] = None


class DatosManuales(BaseModel):
    proveedor: Optional[str] = None
    mes: Optional[str] = None
    anio: Optional[str] = None
    fecha_desde: Optional[str] = None  # formato YYYY-MM-DD
    fecha_hasta: Optional[str] = None  # formato YYYY-MM-DD
    monto_total: Optional[float] = None
    numero_factura: Optional[str] = None


class EnvioPreviewRequest(BaseModel):
    factura_id: Optional[UUID] = None
    plantilla_id: UUID
    clientes: List[ClienteEnvioItem] = Field(min_length=1)
    datos_manuales: Optional[DatosManuales] = None


class EnvioEnviarRequest(EnvioPreviewRequest):
    asunto_override: Optional[str] = None
    cuerpo_override: Optional[str] = None
    cc: list[EmailStr] = []


class _ClienteOut(BaseModel):
    nombre: str
    email: Optional[str] = None


class _FacturaOut(BaseModel):
    numero_factura: Optional[str] = None
    monto_total: Optional[float] = None
    drive_url: Optional[str] = None


class EnvioPreviewResponse(BaseModel):
    asunto: str
    cuerpo: str
    cliente: _ClienteOut
    factura: _FacturaOut


class _FacturaSummary(BaseModel):
    numero_factura: Optional[str] = None


class _ProveedorSummary(BaseModel):
    nombre: str


class HistorialEnvioResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, json_encoders={UUID: str})

    id: UUID
    tipo: str
    destinatario_email: str
    destinatario_nombre: Optional[str] = None
    asunto: str
    estado: str
    error_msg: Optional[str] = None
    factura_id: Optional[UUID] = None
    gmail_message_id: Optional[str] = None
    sheets_row: Optional[int] = None
    created_at: datetime
    factura: Optional[_FacturaSummary] = None
    proveedor: Optional[_ProveedorSummary] = None
