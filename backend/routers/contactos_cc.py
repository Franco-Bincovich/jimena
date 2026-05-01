from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from repositories import contacto_cc_repo
from schemas.contacto_cc import ContactoCCCreate, ContactoCCResponse

router = APIRouter(prefix="/contactos-cc", tags=["contactos-cc"])


@router.get("", response_model=list[ContactoCCResponse])
async def listar(db: Session = Depends(get_db)):
    return contacto_cc_repo.find_all(db)


@router.post("", response_model=ContactoCCResponse, status_code=201)
async def crear(data: ContactoCCCreate, db: Session = Depends(get_db)):
    return contacto_cc_repo.create(db, data)


@router.delete("/{contacto_id}", status_code=204)
async def eliminar(contacto_id: UUID, db: Session = Depends(get_db)):
    deleted = contacto_cc_repo.delete(db, str(contacto_id))
    if not deleted:
        raise HTTPException(status_code=404, detail="Contacto no encontrado")
