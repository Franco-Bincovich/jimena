from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from models import Proveedor
from schemas.proveedor import ProveedorCreate, ProveedorUpdate


def find_all(db: Session) -> list[Proveedor]:
    return db.query(Proveedor).order_by(Proveedor.nombre).all()


def find_by_id(db: Session, proveedor_id: str) -> Optional[Proveedor]:
    return db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()


def find_by_email(db: Session, email: str) -> Optional[Proveedor]:
    return (
        db.query(Proveedor)
        .filter(func.lower(Proveedor.email) == email.lower())
        .first()
    )


def create(db: Session, data: ProveedorCreate) -> Proveedor:
    proveedor = Proveedor(**data.model_dump())
    db.add(proveedor)
    db.commit()
    db.refresh(proveedor)
    return proveedor


def update(db: Session, proveedor_id: str, data: ProveedorUpdate) -> Proveedor:
    proveedor = find_by_id(db, proveedor_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(proveedor, field, value)
    db.commit()
    db.refresh(proveedor)
    return proveedor


def delete(db: Session, proveedor_id: str) -> bool:
    proveedor = find_by_id(db, proveedor_id)
    if not proveedor:
        return False
    db.delete(proveedor)
    db.commit()
    return True
