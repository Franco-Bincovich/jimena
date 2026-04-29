from typing import Optional

from sqlalchemy.orm import Session

from models import Plantilla
from schemas.plantilla import PlantillaCreate, PlantillaUpdate


def find_all(db: Session) -> list[Plantilla]:
    return db.query(Plantilla).order_by(Plantilla.nombre).all()


def find_by_tipo(db: Session, tipo: str) -> list[Plantilla]:
    return (
        db.query(Plantilla)
        .filter(Plantilla.tipo == tipo)
        .order_by(Plantilla.nombre)
        .all()
    )


def find_by_id(db: Session, plantilla_id: str) -> Optional[Plantilla]:
    return db.query(Plantilla).filter(Plantilla.id == plantilla_id).first()


def create(db: Session, data: PlantillaCreate) -> Plantilla:
    plantilla = Plantilla(**data.model_dump())
    db.add(plantilla)
    db.commit()
    db.refresh(plantilla)
    return plantilla


def update(db: Session, plantilla_id: str, data: PlantillaUpdate) -> Plantilla:
    plantilla = find_by_id(db, plantilla_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(plantilla, field, value)
    db.commit()
    db.refresh(plantilla)
    return plantilla


def delete(db: Session, plantilla_id: str) -> bool:
    plantilla = find_by_id(db, plantilla_id)
    if not plantilla:
        return False
    db.delete(plantilla)
    db.commit()
    return True
