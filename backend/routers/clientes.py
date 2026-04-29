from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from schemas.cliente import ClienteCreate, ClienteResponse, ClienteUpdate
from services import cliente_service

router = APIRouter(prefix="/clientes", tags=["clientes"])


@router.get("", response_model=list[ClienteResponse])
async def list_clientes(db: Session = Depends(get_db)):
    return cliente_service.get_all(db)


@router.get("/buscar-cuit", response_model=ClienteResponse)
async def buscar_por_cuit(cuit: str, db: Session = Depends(get_db)):
    return cliente_service.buscar_por_cuit(db, cuit)


@router.post("", response_model=ClienteResponse, status_code=status.HTTP_201_CREATED)
async def create_cliente(data: ClienteCreate, db: Session = Depends(get_db)):
    return cliente_service.create(db, data)


@router.put("/{cliente_id}", response_model=ClienteResponse)
async def update_cliente(
    cliente_id: UUID, data: ClienteUpdate, db: Session = Depends(get_db)
):
    return cliente_service.update(db, str(cliente_id), data)


@router.delete("/{cliente_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cliente(cliente_id: UUID, db: Session = Depends(get_db)):
    cliente_service.delete(db, str(cliente_id))
