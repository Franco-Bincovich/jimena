from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from repositories import envio_repo
from schemas.envio import EnvioEnviarRequest, EnvioPreviewRequest, EnvioPreviewResponse, HistorialEnvioResponse
from services import envio_service
from services.google_auth_service import get_credentials

router = APIRouter(tags=["envios"])


@router.post("/envios/preview", response_model=EnvioPreviewResponse)
async def preview_envio(data: EnvioPreviewRequest, db: Session = Depends(get_db)):
    return envio_service.preview(
        factura_id=str(data.factura_id) if data.factura_id else None,
        clientes_input=data.clientes,
        plantilla_id=str(data.plantilla_id),
        db=db,
        datos_manuales=data.datos_manuales,
    )


@router.post("/envios/enviar")
async def enviar_factura(data: EnvioEnviarRequest, db: Session = Depends(get_db)):
    get_credentials(db)  # lanza GOOGLE_NOT_CONNECTED si no hay sesión activa
    return envio_service.enviar(
        factura_id=str(data.factura_id) if data.factura_id else None,
        clientes_input=data.clientes,
        plantilla_id=str(data.plantilla_id),
        asunto_override=data.asunto_override,
        cuerpo_override=data.cuerpo_override,
        cc=data.cc,
        db=db,
        datos_manuales=data.datos_manuales,
    )


@router.get("/historial", response_model=List[HistorialEnvioResponse])
async def listar_historial(db: Session = Depends(get_db)):
    return envio_repo.find_all(db)
