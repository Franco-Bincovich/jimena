from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from schemas.plantilla import PlantillaCreate, PlantillaResponse, PlantillaUpdate
from services import plantilla_service

router = APIRouter(prefix="/plantillas", tags=["plantillas"])


@router.get("", response_model=list[PlantillaResponse])
async def list_plantillas(tipo: Optional[str] = None, db: Session = Depends(get_db)):
    return plantilla_service.get_all(db, tipo)


@router.post("", response_model=PlantillaResponse, status_code=status.HTTP_201_CREATED)
async def create_plantilla(data: PlantillaCreate, db: Session = Depends(get_db)):
    return plantilla_service.create(db, data)


@router.put("/{plantilla_id}", response_model=PlantillaResponse)
async def update_plantilla(
    plantilla_id: UUID, data: PlantillaUpdate, db: Session = Depends(get_db)
):
    return plantilla_service.update(db, str(plantilla_id), data)


@router.delete("/{plantilla_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plantilla(plantilla_id: UUID, db: Session = Depends(get_db)):
    plantilla_service.delete(db, str(plantilla_id))
