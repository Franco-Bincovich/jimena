from typing import Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models import Pedido, PedidoItem


def find_all(db: Session) -> list[Pedido]:
    """Devuelve todos los pedidos ordenados por created_at descendente."""
    return db.query(Pedido).order_by(Pedido.created_at.desc()).all()


def find_by_id(db: Session, pedido_id: str) -> Optional[Pedido]:
    """Devuelve un Pedido por su ID o None si no existe."""
    return db.query(Pedido).filter(Pedido.id == pedido_id).first()


def find_by_proveedor_mes_anio(db: Session, proveedor_id: str, mes: int, anio: int) -> Optional[Pedido]:
    return db.query(Pedido).filter(
        Pedido.proveedor_id == proveedor_id,
        Pedido.mes == mes,
        Pedido.anio == anio,
    ).first()


def create(
    db: Session,
    proveedor_id: str,
    mes: int,
    anio: int,
    fecha_desde,
    fecha_hasta,
) -> tuple[Pedido, bool]:
    """
    Crea un Pedido nuevo. Si ya existe uno para el mismo proveedor+mes+año lo reutiliza.

    Returns:
        (pedido, created) — created=False cuando se reutilizó un pedido existente.
    """
    pedido = Pedido(
        proveedor_id=proveedor_id,
        mes=mes,
        anio=anio,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
    )
    db.add(pedido)
    try:
        db.commit()
        db.refresh(pedido)
        return pedido, True
    except IntegrityError:
        db.rollback()
        return find_by_proveedor_mes_anio(db, proveedor_id, mes, anio), False


def create_item(
    db: Session, pedido_id: str, cliente_id: str, consultas_api: Optional[int]
) -> PedidoItem:
    """Crea un PedidoItem asociado a un pedido existente."""
    item = PedidoItem(pedido_id=pedido_id, cliente_id=cliente_id, consultas_api=consultas_api)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def get_items(db: Session, pedido_id: str) -> list[PedidoItem]:
    """Devuelve todos los PedidoItems de un pedido con su relación cliente cargada."""
    return db.query(PedidoItem).filter(PedidoItem.pedido_id == pedido_id).all()


def marcar_enviado(db: Session, pedido_id: str, gmail_message_id: str) -> Pedido:
    """Actualiza el estado del pedido a 'enviado' y guarda el gmail_message_id."""
    pedido = find_by_id(db, pedido_id)
    pedido.estado = "enviado"
    pedido.gmail_message_id = gmail_message_id
    db.commit()
    db.refresh(pedido)
    return pedido
