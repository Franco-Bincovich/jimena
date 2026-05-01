from typing import Optional

from sqlalchemy.orm import Session

from models import HistorialEnvio


def create(
    db: Session,
    tipo: str,
    destinatario_email: str,
    destinatario_nombre: Optional[str],
    asunto: str,
    estado: str,
    factura_id: Optional[str] = None,
    gmail_message_id: Optional[str] = None,
    sheets_row: Optional[int] = None,
    error_msg: Optional[str] = None,
) -> HistorialEnvio:
    """Persiste un nuevo registro en historial_envios y lo devuelve."""
    historial = HistorialEnvio(
        tipo=tipo,
        destinatario_email=destinatario_email,
        destinatario_nombre=destinatario_nombre,
        asunto=asunto,
        estado=estado,
        factura_id=factura_id,
        gmail_message_id=gmail_message_id,
        sheets_row=sheets_row,
        error_msg=error_msg,
    )
    db.add(historial)
    db.commit()
    db.refresh(historial)
    return historial


def find_all(db: Session) -> list[dict]:
    """Devuelve todos los envíos ordenados por created_at desc, con factura y proveedor."""
    registros = db.query(HistorialEnvio).order_by(HistorialEnvio.created_at.desc()).all()
    return [_to_dict(h) for h in registros]


def find_by_id(db: Session, historial_id: str) -> Optional[HistorialEnvio]:
    """Devuelve un HistorialEnvio por ID o None si no existe."""
    return db.query(HistorialEnvio).filter(HistorialEnvio.id == historial_id).first()


def _to_dict(h: HistorialEnvio) -> dict:
    factura_data = None
    proveedor_data = None
    if h.factura:
        factura_data = {"numero_factura": h.factura.numero_factura}
        if h.factura.proveedor:
            proveedor_data = {"nombre": h.factura.proveedor.nombre}
    return {
        "id": h.id, "tipo": h.tipo, "destinatario_email": h.destinatario_email,
        "destinatario_nombre": h.destinatario_nombre, "asunto": h.asunto,
        "estado": h.estado, "error_msg": h.error_msg, "factura_id": h.factura_id,
        "gmail_message_id": h.gmail_message_id, "sheets_row": h.sheets_row,
        "created_at": h.created_at, "factura": factura_data, "proveedor": proveedor_data,
    }
