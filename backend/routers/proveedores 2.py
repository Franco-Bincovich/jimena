from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from schemas.proveedor import ProveedorCreate, ProveedorResponse, ProveedorUpdate
from services import proveedor_service

router = APIRouter(prefix="/proveedores", tags=["proveedores"])


@router.get("", response_model=list[ProveedorResponse])
async def list_proveedores(db: Session = Depends(get_db)):
    return proveedor_service.get_all(db)


@router.post("", response_model=ProveedorResponse, status_code=status.HTTP_201_CREATED)
async def create_proveedor(data: ProveedorCreate, db: Session = Depends(get_db)):
    return proveedor_service.create(db, data)


@router.put("/{proveedor_id}", response_model=ProveedorResponse)
async def update_proveedor(
    proveedor_id: UUID, data: ProveedorUpdate, db: Session = Depends(get_db)
):
    return proveedor_service.update(db, str(proveedor_id), data)


@router.delete("/{proveedor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_proveedor(proveedor_id: UUID, db: Session = Depends(get_db)):
    proveedor_service.delete(db, str(proveedor_id))
