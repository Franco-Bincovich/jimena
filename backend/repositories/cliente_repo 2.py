from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from models import Cliente
from schemas.cliente import ClienteCreate, ClienteUpdate


def find_all(db: Session) -> list[Cliente]:
    return db.query(Cliente).order_by(Cliente.nombre).all()


def find_by_id(db: Session, cliente_id: str) -> Optional[Cliente]:
    return db.query(Cliente).filter(Cliente.id == cliente_id).first()


def find_by_email(db: Session, email: str) -> Optional[Cliente]:
    return (
        db.query(Cliente)
        .filter(func.lower(Cliente.email) == email.lower())
        .first()
    )


def find_by_cuit(db: Session, cuit: str) -> Optional[Cliente]:
    return db.query(Cliente).filter(Cliente.cuit == cuit).first()


def create(db: Session, data: ClienteCreate) -> Cliente:
    cliente = Cliente(**data.model_dump())
    db.add(cliente)
    db.commit()
    db.refresh(cliente)
    return cliente


def update(db: Session, cliente_id: str, data: ClienteUpdate) -> Cliente:
    cliente = find_by_id(db, cliente_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(cliente, field, value)
    db.commit()
    db.refresh(cliente)
    return cliente


def delete(db: Session, cliente_id: str) -> bool:
    cliente = find_by_id(db, cliente_id)
    if not cliente:
        return False
    db.delete(cliente)
    db.commit()
    return True
