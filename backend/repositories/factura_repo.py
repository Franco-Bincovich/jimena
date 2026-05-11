from typing import Optional

from sqlalchemy.orm import Session

from models import Factura, FacturaCliente


def find_all(db: Session) -> list[Factura]:
    return db.query(Factura).order_by(Factura.fecha_recepcion.desc()).all()


def find_pendientes(db: Session) -> list[Factura]:
    return (
        db.query(Factura)
        .filter(Factura.estado == "pendiente_confirmacion")
        .order_by(Factura.fecha_recepcion.desc())
        .all()
    )


def find_by_id(db: Session, factura_id: str) -> Optional[Factura]:
    return db.query(Factura).filter(Factura.id == factura_id).first()


def find_by_gmail_message_id(db: Session, gmail_message_id: str) -> Optional[Factura]:
    return (
        db.query(Factura)
        .filter(Factura.gmail_message_id == gmail_message_id)
        .first()
    )


def find_by_nombre_archivo(db: Session, nombre_archivo: str) -> Optional[Factura]:
    return db.query(Factura).filter(Factura.nombre_archivo == nombre_archivo).first()


def create(db: Session, fields: dict) -> Factura:
    factura = Factura(**fields)
    db.add(factura)
    db.commit()
    db.refresh(factura)
    return factura


def update(db: Session, factura_id: str, fields: dict) -> Factura:
    factura = find_by_id(db, factura_id)
    for key, value in fields.items():
        setattr(factura, key, value)
    db.commit()
    db.refresh(factura)
    return factura


def delete(db: Session, factura_id: str) -> bool:
    factura = find_by_id(db, factura_id)
    if not factura:
        return False
    db.delete(factura)
    db.commit()
    return True


def create_cliente_asociado(db: Session, factura_id: str, cliente_id: str) -> FacturaCliente:
    fc = FacturaCliente(factura_id=factura_id, cliente_id=cliente_id)
    db.add(fc)
    db.commit()
    return fc


def delete_clientes_asociados(db: Session, factura_id: str) -> None:
    db.query(FacturaCliente).filter(FacturaCliente.factura_id == factura_id).delete()
    db.commit()
