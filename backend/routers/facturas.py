from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from database import get_db
from schemas.factura import FacturaConfirmar, FacturaResponse
from services import factura_service, gmail_reader_service
from services.google_auth_service import get_credentials

router = APIRouter(prefix="/facturas", tags=["facturas"])


@router.post("/buscar-nuevas")
async def buscar_nuevas(db: Session = Depends(get_db)):
    get_credentials(db)  # lanza GOOGLE_NOT_CONNECTED si no hay sesión activa
    detectadas = gmail_reader_service.buscar_facturas_nuevas(db)
    return {"detectadas": len(detectadas), "facturas": detectadas}


@router.get("", response_model=List[FacturaResponse])
async def listar_facturas(db: Session = Depends(get_db)):
    return factura_service.get_all(db)


@router.get("/pendientes", response_model=List[FacturaResponse])
async def listar_pendientes(db: Session = Depends(get_db)):
    return factura_service.get_pendientes(db)


@router.put("/{factura_id}/confirmar", response_model=FacturaResponse)
async def confirmar_factura(
    factura_id: UUID,
    data: FacturaConfirmar,
    db: Session = Depends(get_db),
):
    return factura_service.confirmar(db, str(factura_id), data)


@router.delete("/{factura_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_factura(factura_id: UUID, db: Session = Depends(get_db)):
    factura_service.eliminar(db, str(factura_id))
    return Response(status_code=status.HTTP_204_NO_CONTENT)
