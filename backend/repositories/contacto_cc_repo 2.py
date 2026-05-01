from typing import Optional

from sqlalchemy.orm import Session

from models import ContactoCC
from schemas.contacto_cc import ContactoCCCreate


def find_all(db: Session) -> list[ContactoCC]:
    return db.query(ContactoCC).order_by(ContactoCC.nombre).all()


def find_by_id(db: Session, contacto_id: str) -> Optional[ContactoCC]:
    return db.query(ContactoCC).filter(ContactoCC.id == contacto_id).first()


def create(db: Session, data: ContactoCCCreate) -> ContactoCC:
    contacto = ContactoCC(**data.model_dump())
    db.add(contacto)
    db.commit()
    db.refresh(contacto)
    return contacto


def delete(db: Session, contacto_id: str) -> bool:
    contacto = find_by_id(db, contacto_id)
    if not contacto:
        return False
    db.delete(contacto)
    db.commit()
    return True
