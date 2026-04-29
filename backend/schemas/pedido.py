from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class PedidoItemInput(BaseModel):
    cliente_id: UUID
    consultas_api: Optional[int] = None


class PedidoRequest(BaseModel):
    proveedor_id: UUID
    plantilla_id: UUID
    mes: int = Field(..., ge=1, le=12)
    anio: int
    fecha_desde: date
    fecha_hasta: date
    items: list[PedidoItemInput]


class _ProveedorOut(BaseModel):
    nombre: str
    email: Optional[str] = None


class _ClienteOut(BaseModel):
    nombre: str
    cuit: Optional[str] = None


class PedidoPreviewResponse(BaseModel):
    asunto: str
    cuerpo: str
    proveedor: _ProveedorOut
    clientes: list[_ClienteOut]


class PedidoEnviarRequest(PedidoRequest):
    asunto_override: Optional[str] = None
    cuerpo_override: Optional[str] = None
    cc: list[str] = []
