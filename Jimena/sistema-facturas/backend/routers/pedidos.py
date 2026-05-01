from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.pedido import PedidoEnviarRequest, PedidoPreviewResponse, PedidoRequest
from services import pedido_service
from services.google_auth_service import get_credentials

router = APIRouter(prefix="/pedidos", tags=["pedidos"])


@router.post("/preview", response_model=PedidoPreviewResponse)
async def preview_pedido(data: PedidoRequest, db: Session = Depends(get_db)):
    return pedido_service.preview(
        proveedor_id=str(data.proveedor_id),
        plantilla_id=str(data.plantilla_id),
        mes=data.mes,
        anio=data.anio,
        fecha_desde=data.fecha_desde,
        fecha_hasta=data.fecha_hasta,
        items=data.clientes,
        db=db,
    )


@router.post("/enviar")
async def enviar_pedido(data: PedidoEnviarRequest, db: Session = Depends(get_db)):
    get_credentials(db)  # lanza GOOGLE_NOT_CONNECTED si no hay sesión activa
    return pedido_service.enviar(
        proveedor_id=str(data.proveedor_id),
        plantilla_id=str(data.plantilla_id),
        mes=data.mes,
        anio=data.anio,
        fecha_desde=data.fecha_desde,
        fecha_hasta=data.fecha_hasta,
        items=data.clientes,
        asunto_override=data.asunto_override,
        cuerpo_override=data.cuerpo_override,
        cc=data.cc,
        db=db,
    )


@router.get("")
async def listar_pedidos(db: Session = Depends(get_db)):
    return pedido_service.listar(db)
