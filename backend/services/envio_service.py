from typing import Optional

from sqlalchemy.orm import Session

from repositories import cliente_repo, factura_repo, google_config_repo, plantilla_repo
from services import drive_service, gmail_sender_service, sheets_writer_service, template_service
from services.envio_helpers import FacturaVacia, obtener_pdf_path, registrar_historial, resolver_clientes
from utils.errors import AppError
from utils.logger import logger


def preview(
    factura_id: Optional[str], clientes_input: list, plantilla_id: str,
    db: Session, datos_manuales=None,
) -> dict:
    """
    Construye el email sin enviarlo.
    Si factura_id es None, usa una factura vacía y omite validaciones de estado.
    Si factura_id está presente, valida que existe (cualquier estado salvo descartada).
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
    else:
        factura = FacturaVacia()

    plantilla = plantilla_repo.find_by_id(db, plantilla_id)
    if not plantilla:
        raise AppError("Plantilla no encontrada", "PLANTILLA_NOT_FOUND", 404)
    if plantilla.tipo != "envio":
        raise AppError("La plantilla no es de tipo envio", "PLANTILLA_TIPO_INVALIDO", 400)

    items = resolver_clientes(clientes_input, db)
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
    pdf_path = obtener_pdf_path(factura, db) if factura else None

    try:
        gmail_id = gmail_sender_service.enviar_email(
            db, cliente_principal.email, asunto, cuerpo, pdf_path, cc=cc
        )
    except AppError as exc:
        registrar_historial(
            db, factura_id, cliente_principal.email, cliente_principal.nombre, asunto, "error",
            error_msg=str(exc),
        )
        raise

    if factura:
        drive_url = factura.drive_url or ""
        try:
            sheets_writer_service.registrar_envio(factura, cliente_principal, drive_url, None, db)
        except Exception as exc:
            logger.error("Error en Sheets (best-effort)", extra={"factura_id": factura_id, "error": str(exc)})

    historial = registrar_historial(
        db, factura_id, cliente_principal.email, cliente_principal.nombre, asunto, "enviado", gmail_id
    )
    logger.info("Factura enviada", extra={"factura_id": factura_id, "cliente": cliente_principal.email})
    return {"historial_id": historial.id, "gmail_message_id": gmail_id}
