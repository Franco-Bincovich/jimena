from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from models import HistorialEnvio, Pedido
from repositories import cliente_repo, google_config_repo, pedido_repo, plantilla_repo, proveedor_repo
from services import gmail_sender_service, sheets_writer_service, template_service
from utils.errors import AppError
from utils.logger import logger


@dataclass
class _ItemProxy:
    """Emula PedidoItem para resolver variables de plantilla antes de persistir."""
    cliente: object
    consultas_api: Optional[int]


def listar(db: Session) -> list[dict]:
    """Devuelve todos los pedidos con proveedor e items incluidos."""
    return [_to_dict(p) for p in pedido_repo.find_all(db)]


def _to_dict(p: Pedido) -> dict:
    prov = (
        {"id": p.proveedor.id, "nombre": p.proveedor.nombre, "email": p.proveedor.email}
        if p.proveedor else None
    )
    items = [
        {"id": i.id, "cliente_id": i.cliente_id, "consultas_api": i.consultas_api,
         "cliente": {"nombre": i.cliente.nombre, "cuit": i.cliente.cuit} if i.cliente else None}
        for i in p.items
    ]
    return {
        "id": p.id, "mes": p.mes, "anio": p.anio, "estado": p.estado,
        "fecha_desde": p.fecha_desde, "fecha_hasta": p.fecha_hasta,
        "gmail_message_id": p.gmail_message_id, "created_at": p.created_at,
        "proveedor": prov, "items": items,
    }


def preview(
    proveedor_id: str, plantilla_id: str, mes: int, anio: int,
    fecha_desde, fecha_hasta, items: list, db: Session,
) -> dict:
    """
    Construye el email sin enviarlo.
    Valida proveedor, plantilla (tipo='pedido') y todos los clientes.
    Resuelve variables via template_service.

    Returns:
        {asunto, cuerpo, proveedor: {nombre, email}, clientes: [{nombre, cuit}]}.

    Raises:
        AppError PROVEEDOR_NOT_FOUND 404, PLANTILLA_NOT_FOUND 404,
        PLANTILLA_TIPO_INVALIDO 400, CLIENTE_NOT_FOUND 404.
    """
    proveedor = proveedor_repo.find_by_id(db, proveedor_id)
    if not proveedor:
        raise AppError("Proveedor no encontrado", "PROVEEDOR_NOT_FOUND", 404)

    plantilla = plantilla_repo.find_by_id(db, plantilla_id)
    if not plantilla:
        raise AppError("Plantilla no encontrada", "PLANTILLA_NOT_FOUND", 404)

    if plantilla.tipo != "pedido":
        raise AppError("La plantilla no es de tipo pedido", "PLANTILLA_TIPO_INVALIDO", 400)

    proxies = []
    for item in items:
        cliente = cliente_repo.find_by_id(db, str(item.cliente_id))
        if not cliente:
            raise AppError(f"Cliente no encontrado: {item.cliente_id}", "CLIENTE_NOT_FOUND", 404)
        proxies.append(_ItemProxy(cliente, item.consultas_api))

    config = google_config_repo.find(db)
    periodo = {"mes": mes, "anio": anio, "fecha_desde": fecha_desde, "fecha_hasta": fecha_hasta}
    resuelto = template_service.resolver_variables_pedido(plantilla, proveedor, proxies, periodo, config)
    return {
        "asunto": resuelto["asunto"],
        "cuerpo": resuelto["cuerpo"],
        "proveedor": {"nombre": proveedor.nombre, "email": proveedor.email},
        "clientes": [{"nombre": px.cliente.nombre, "cuit": px.cliente.cuit} for px in proxies],
    }


def enviar(
    proveedor_id: str, plantilla_id: str, mes: int, anio: int,
    fecha_desde, fecha_hasta, items: list,
    asunto_override: Optional[str], cuerpo_override: Optional[str],
    cc: list[str], db: Session,
) -> dict:
    """
    Flujo completo: preview → Gmail → Pedido+Items en DB → Sheets → HistorialEnvio.
    Usa asunto_override/cuerpo_override si el usuario editó el email.
    Si Gmail falla: registra HistorialEnvio estado='error' y relanza AppError.

    Returns:
        {pedido_id, gmail_message_id, sheets_rows}.
    """
    vista = preview(proveedor_id, plantilla_id, mes, anio, fecha_desde, fecha_hasta, items, db)
    asunto = asunto_override or vista["asunto"]
    cuerpo = cuerpo_override or vista["cuerpo"]
    dest_email = vista["proveedor"]["email"]
    dest_nombre = vista["proveedor"]["nombre"]

    try:
        gmail_id = gmail_sender_service.enviar_email(
            db=db, destinatario_email=dest_email, asunto=asunto, cuerpo=cuerpo, cc=cc
        )
    except AppError as exc:
        _registrar_historial(db, asunto, dest_email, dest_nombre, "error", error_msg=str(exc))
        raise

    fecha_desde_dt = datetime(fecha_desde.year, fecha_desde.month, fecha_desde.day)
    fecha_hasta_dt = datetime(fecha_hasta.year, fecha_hasta.month, fecha_hasta.day)
    pedido, created = pedido_repo.create(db, proveedor_id, mes, anio, fecha_desde_dt, fecha_hasta_dt)

    sheets_rows = []
    if created:
        for item in items:
            pedido_repo.create_item(db, pedido.id, str(item.cliente_id), item.consultas_api)
        pedido_repo.marcar_enviado(db, pedido.id, gmail_id)
        try:
            sheets_rows = sheets_writer_service.registrar_pedido(
                pedido, pedido_repo.get_items(db, pedido.id), db
            )
        except Exception as exc:
            logger.error("Error en Sheets (best-effort)", extra={"pedido_id": pedido.id, "error": str(exc)})
    else:
        pedido_repo.marcar_enviado(db, pedido.id, gmail_id)
        logger.info("Pedido reutilizado, items y Sheets omitidos", extra={"pedido_id": pedido.id})

    _registrar_historial(db, asunto, dest_email, dest_nombre, "enviado", gmail_message_id=gmail_id)
    logger.info("Pedido enviado", extra={"pedido_id": pedido.id, "proveedor": dest_nombre})
    return {"pedido_id": pedido.id, "gmail_message_id": gmail_id, "sheets_rows": sheets_rows}


def _registrar_historial(
    db: Session, asunto: str, destinatario_email: str, destinatario_nombre: Optional[str],
    estado: str, gmail_message_id: Optional[str] = None, error_msg: Optional[str] = None,
) -> None:
    historial = HistorialEnvio(
        tipo="pedido", destinatario_email=destinatario_email,
        destinatario_nombre=destinatario_nombre, asunto=asunto,
        estado=estado, gmail_message_id=gmail_message_id, error_msg=error_msg,
    )
    db.add(historial)
    db.commit()
