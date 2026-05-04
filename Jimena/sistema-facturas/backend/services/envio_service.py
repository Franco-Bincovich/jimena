import os
from dataclasses import dataclass
from typing import List, Optional

from sqlalchemy.orm import Session

from models import HistorialEnvio
from repositories import cliente_repo, envio_repo, factura_repo, google_config_repo, plantilla_repo
from services import drive_service, gmail_sender_service, sheets_writer_service, template_service
from utils.errors import AppError
from utils.logger import logger


@dataclass
class _ClienteConMonto:
    """Par (cliente ORM, monto opcional) para pasar al template_service."""
    cliente: object
    monto: Optional[float]


@dataclass
class _FacturaVacia:
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


def _resolver_clientes(clientes_input: list, db: Session) -> List[_ClienteConMonto]:
    """Valida y resuelve todos los ClienteEnvioItem contra la DB."""
    items = []
    for ci in clientes_input:
        cliente = cliente_repo.find_by_id(db, str(ci.cliente_id))
        if not cliente:
            raise AppError(f"Cliente no encontrado: {ci.cliente_id}", "CLIENTE_NOT_FOUND", 404)
        items.append(_ClienteConMonto(cliente, ci.monto))
    return items


def preview(factura_id: Optional[str], clientes_input: list, plantilla_id: str, db: Session, datos_manuales=None) -> dict:
    """
    Construye el email sin enviarlo.
    Si factura_id es None, usa una factura vacía y omite validaciones de estado.
    Si factura_id está presente, valida que existe y estado == 'confirmada'.
    Valida plantilla (tipo == 'envio') y todos los clientes.
    El primer item es el destinatario principal.

    Returns:
        {asunto, cuerpo, cliente: {nombre, email}, factura: {numero_factura, monto_total, drive_url}}.

    Raises:
        AppError FACTURA_NOT_FOUND 404, FACTURA_NOT_CONFIRMADA 400,
        PLANTILLA_NOT_FOUND 404, PLANTILLA_TIPO_INVALIDO 400, CLIENTE_NOT_FOUND 404.
    """
    if factura_id:
        factura = factura_repo.find_by_id(db, factura_id)
        if not factura:
            raise AppError("Factura no encontrada", "FACTURA_NOT_FOUND", 404)
        if factura.estado != "confirmada":
            raise AppError("La factura no está confirmada", "FACTURA_NOT_CONFIRMADA", 400)
    else:
        factura = _FacturaVacia()

    plantilla = plantilla_repo.find_by_id(db, plantilla_id)
    if not plantilla:
        raise AppError("Plantilla no encontrada", "PLANTILLA_NOT_FOUND", 404)
    if plantilla.tipo != "envio":
        raise AppError("La plantilla no es de tipo envio", "PLANTILLA_TIPO_INVALIDO", 400)

    items = _resolver_clientes(clientes_input, db)
    cliente_principal = items[0].cliente

    config = google_config_repo.find(db)
    resuelto = template_service.resolver_variables_envio(
        plantilla, cliente_principal, factura, items, config, datos_manuales
    )
    return {
        "asunto": resuelto["asunto"],
        "cuerpo": resuelto["cuerpo"],
        "cliente": {"nombre": cliente_principal.nombre, "email": cliente_principal.email},
        "factura": {
            "numero_factura": factura.numero_factura,
            "monto_total": factura.monto_total,
            "drive_url": factura.drive_url,
        },
    }


def enviar(
    factura_id: Optional[str], clientes_input: list, plantilla_id: str,
    asunto_override: Optional[str], cuerpo_override: Optional[str],
    cc: list, db: Session, datos_manuales=None,
) -> dict:
    """
    Flujo completo de envío a cliente.
    1. preview() → valida y resuelve el email
    2. Usa asunto_override/cuerpo_override si el usuario editó
    3. Si hay factura: obtiene PDF (local o descarga de Drive)
    4. Envía email (con adjunto si hay PDF) via gmail_sender_service
    5. Si hay factura: copia a Clientes/ en Drive (best-effort)
    6. Si hay factura: registra en Sheets (best-effort)
    7. Registra en HistorialEnvio
    Si Gmail falla: registra historial estado='error' y relanza AppError.

    Returns:
        {historial_id, gmail_message_id}.
    """
    vista = preview(factura_id, clientes_input, plantilla_id, db, datos_manuales)
    asunto = asunto_override or vista["asunto"]
    cuerpo = cuerpo_override or vista["cuerpo"]
    cliente_principal = cliente_repo.find_by_id(db, str(clientes_input[0].cliente_id))

    factura = factura_repo.find_by_id(db, factura_id) if factura_id else None
    pdf_path = _obtener_pdf_path(factura, db) if factura else None

    try:
        gmail_id = gmail_sender_service.enviar_email(
            db, cliente_principal.email, asunto, cuerpo, pdf_path, cc=cc
        )
    except AppError as exc:
        _registrar_historial(
            db, factura_id, cliente_principal.email, cliente_principal.nombre, asunto, "error",
            error_msg=str(exc),
        )
        raise

    if factura:
        drive_url = factura.drive_url or ""
        if factura.drive_file_id:
            try:
                resultado = drive_service.copiar_factura_cliente(
                    factura.drive_file_id, cliente_principal.nombre, db
                )
                drive_url = resultado["url"]
            except Exception as exc:
                logger.error(
                    "Error copiando a Drive (best-effort)",
                    extra={"file_id": factura.drive_file_id, "error": str(exc)},
                )
        try:
            sheets_writer_service.registrar_envio(factura, cliente_principal, drive_url, None, db)
        except Exception as exc:
            logger.error("Error en Sheets (best-effort)", extra={"factura_id": factura_id, "error": str(exc)})

    historial = _registrar_historial(
        db, factura_id, cliente_principal.email, cliente_principal.nombre, asunto, "enviado", gmail_id
    )
    logger.info("Factura enviada", extra={"factura_id": factura_id, "cliente": cliente_principal.email})
    return {"historial_id": historial.id, "gmail_message_id": gmail_id}


def _obtener_pdf_path(factura, db: Session) -> Optional[str]:
    """Devuelve ruta local al PDF; descarga de Drive si no existe localmente."""
    local = os.path.join("uploads", factura.nombre_archivo)
    if os.path.exists(local):
        return local
    if factura.drive_file_id:
        return drive_service.descargar_pdf(factura.drive_file_id, factura.nombre_archivo, db)
    return None


def _registrar_historial(
    db: Session, factura_id: str, email: str, nombre: Optional[str],
    asunto: str, estado: str, gmail_id: Optional[str] = None, error_msg: Optional[str] = None,
) -> HistorialEnvio:
    return envio_repo.create(
        db=db, tipo="envio", destinatario_email=email, destinatario_nombre=nombre,
        asunto=asunto, estado=estado, factura_id=factura_id,
        gmail_message_id=gmail_id, error_msg=error_msg,
    )
