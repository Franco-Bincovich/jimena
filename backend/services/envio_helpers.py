from dataclasses import dataclass
from typing import List, Optional

from sqlalchemy.orm import Session

from models import HistorialEnvio
from repositories import cliente_repo, envio_repo
from utils.errors import AppError
from utils.logger import logger


@dataclass
class ClienteConMonto:
    """Par (cliente ORM, monto opcional) para pasar al template_service."""
    cliente: object
    monto: Optional[float]


@dataclass
class FacturaVacia:
    """Factura nula para preview/envío sin factura seleccionada."""
    fecha_factura: None = None
    numero_factura: None = None
    monto_total: None = None
    fecha_desde: None = None
    fecha_hasta: None = None
    proveedor: None = None
    drive_url: None = None
    drive_file_id: None = None
    nombre_archivo: None = None


def resolver_clientes(clientes_input: list, db: Session) -> List[ClienteConMonto]:
    """Valida y resuelve todos los ClienteEnvioItem contra la DB."""
    items = []
    for ci in clientes_input:
        cliente = cliente_repo.find_by_id(db, str(ci.cliente_id))
        if not cliente:
            raise AppError(f"Cliente no encontrado: {ci.cliente_id}", "CLIENTE_NOT_FOUND", 404)
        items.append(ClienteConMonto(cliente, ci.monto))
    return items


def obtener_pdf_path(factura, db: Session) -> Optional[str]:
    """Descarga el PDF desde Supabase Storage usando el SDK (no requiere bucket público)."""
    if not factura.nombre_archivo:
        return None
    try:
        from services import storage_service  # lazy — evita importación circular
        pdf_bytes = storage_service.descargar_pdf(factura.nombre_archivo)
        path = f"/tmp/{factura.nombre_archivo}"
        with open(path, "wb") as f:
            f.write(pdf_bytes)
        return path
    except Exception as exc:
        logger.error("Error descargando PDF de Supabase Storage",
            extra={"archivo": factura.nombre_archivo, "error": str(exc)})
        return None


def registrar_historial(
    db: Session, factura_id: str, email: str, nombre: Optional[str],
    asunto: str, estado: str, gmail_id: Optional[str] = None, error_msg: Optional[str] = None,
) -> HistorialEnvio:
    """Persiste un registro en HistorialEnvio."""
    return envio_repo.create(
        db=db, tipo="envio", destinatario_email=email, destinatario_nombre=nombre,
        asunto=asunto, estado=estado, factura_id=factura_id,
        gmail_message_id=gmail_id, error_msg=error_msg,
    )
