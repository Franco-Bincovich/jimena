import os
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from models import Factura
from repositories import factura_repo
from utils.errors import AppError
from utils.logger import logger


def get_all(db: Session) -> list[dict]:
    """
    Devuelve todas las facturas ordenadas por fecha_recepcion descendente.

    Args:
        db: Sesión de base de datos.

    Returns:
        Lista de dicts con todos los campos de la factura, proveedor y clientes.
    """
    return [_to_dict(f) for f in factura_repo.find_all(db)]


def get_pendientes(db: Session) -> list[dict]:
    """
    Devuelve solo las facturas en estado 'pendiente_confirmacion'.

    Args:
        db: Sesión de base de datos.

    Returns:
        Lista de dicts con los datos de cada factura pendiente, proveedor y clientes.
    """
    return [_to_dict(f) for f in factura_repo.find_pendientes(db)]


def confirmar(db: Session, factura_id: str, data) -> dict:
    """
    Actualiza los campos de una factura pendiente y la marca como confirmada.
    Reemplaza completamente los FacturaCliente asociados con la nueva lista de cliente_ids.

    Args:
        db: Sesión de base de datos.
        factura_id: ID de la factura a confirmar.
        data: FacturaConfirmar con los campos a actualizar.

    Returns:
        Dict con la factura actualizada, proveedor y clientes.

    Raises:
        AppError FACTURA_NOT_FOUND 404 si la factura no existe.
        AppError FACTURA_YA_CONFIRMADA 400 si ya está en estado confirmada.
    """
    factura = factura_repo.find_by_id(db, factura_id)
    if not factura:
        raise AppError("Factura no encontrada", "FACTURA_NOT_FOUND", 404)
    if factura.estado != "pendiente_confirmacion":
        raise AppError("La factura ya fue confirmada", "FACTURA_YA_CONFIRMADA", 400)

    campos: dict = {"estado": "confirmada"}
    if data.numero_factura is not None:
        campos["numero_factura"] = data.numero_factura
    if data.fecha_factura is not None:
        campos["fecha_factura"] = datetime.strptime(data.fecha_factura, "%d/%m/%Y")
    if data.fecha_desde is not None:
        campos["fecha_desde"] = datetime.strptime(data.fecha_desde, "%d/%m/%Y").date()
    if data.fecha_hasta is not None:
        campos["fecha_hasta"] = datetime.strptime(data.fecha_hasta, "%d/%m/%Y").date()
    if data.monto_total is not None:
        campos["monto_total"] = data.monto_total
    if data.descripcion is not None:
        campos["descripcion"] = data.descripcion
    if data.proveedor_id is not None:
        campos["proveedor_id"] = data.proveedor_id

    factura_repo.delete_clientes_asociados(db, factura_id)
    for cliente_id in data.cliente_ids:
        factura_repo.create_cliente_asociado(db, factura_id, cliente_id)

    factura = factura_repo.update(db, factura_id, campos)
    nombre_prov = factura.proveedor.nombre if factura.proveedor else "Sin_Proveedor"
    _intentar_subida_drive(factura.id, factura.nombre_archivo, nombre_prov, db)
    factura = factura_repo.find_by_id(db, factura_id)
    if not factura.drive_url and factura.nombre_archivo:
        _intentar_url_supabase(factura.id, factura.nombre_archivo, db)
        factura = factura_repo.find_by_id(db, factura_id)
    return _to_dict(factura)


def eliminar(db: Session, factura_id: str) -> None:
    """
    Elimina la factura de la DB, borra el PDF físico de uploads/ si existe
    y elimina el archivo de Supabase Storage (best-effort).

    Args:
        db: Sesión de base de datos.
        factura_id: ID de la factura a eliminar.

    Raises:
        AppError FACTURA_NOT_FOUND 404 si la factura no existe.
    """
    factura = factura_repo.find_by_id(db, factura_id)
    if not factura:
        raise AppError("Factura no encontrada", "FACTURA_NOT_FOUND", 404)
    pdf_path = os.path.join("uploads", factura.nombre_archivo)
    nombre_archivo = factura.nombre_archivo
    factura_repo.delete(db, factura_id)
    if os.path.exists(pdf_path):
        os.remove(pdf_path)
    try:
        from services import storage_service  # lazy — evita importación circular
        storage_service.eliminar_pdf(nombre_archivo)
    except Exception as exc:
        logger.error("Error eliminando PDF de Supabase Storage", extra={"archivo": nombre_archivo, "error": str(exc)})


def _intentar_url_supabase(factura_id: str, nombre_archivo: str, db: Session) -> None:
    """Actualiza drive_url con la URL pública de Supabase Storage como fallback cuando Drive no está configurado."""
    try:
        from services import storage_service  # lazy — evita importación circular
        client = storage_service.get_supabase_client()
        url = client.storage.from_("Facturas").get_public_url(nombre_archivo)
        factura_repo.update(db, factura_id, {"drive_url": url})
    except Exception as exc:
        logger.error("Error obteniendo URL de Supabase Storage", extra={"factura_id": factura_id, "error": str(exc)})


def _intentar_subida_drive(factura_id: str, nombre_archivo: str, nombre_proveedor: str, db: Session) -> None:
    """Sube el PDF a Drive (best-effort). Si falla, loguea el error y continúa."""
    try:
        from services import drive_service  # lazy — evita importación circular
        pdf_path = os.path.join("uploads", nombre_archivo)
        resultado = drive_service.subir_factura_proveedor(pdf_path, nombre_proveedor, nombre_archivo, db)
        factura_repo.update(db, factura_id, {
            "drive_file_id": resultado["file_id"],
            "drive_url": resultado["url"],
            "nombre_en_drive": resultado["nombre_en_drive"],
        })
    except Exception as exc:
        logger.error("Error subiendo a Drive (best-effort)", extra={"factura_id": factura_id, "error": str(exc)})


def _to_dict(factura: Factura) -> dict:
    clientes = [
        {"id": fc.cliente.id, "nombre": fc.cliente.nombre, "cuit": fc.cliente.cuit}
        for fc in factura.clientes_asociados
    ]
    proveedor: Optional[dict] = None
    if factura.proveedor:
        proveedor = {
            "id": factura.proveedor.id,
            "nombre": factura.proveedor.nombre,
            "email": factura.proveedor.email,
        }
    return {
        "id": factura.id,
        "nombre_archivo": factura.nombre_archivo,
        "numero_factura": factura.numero_factura,
        "fecha_factura": factura.fecha_factura,
        "fecha_desde": factura.fecha_desde,
        "fecha_hasta": factura.fecha_hasta,
        "monto_total": factura.monto_total,
        "descripcion": factura.descripcion,
        "estado": factura.estado,
        "fecha_recepcion": factura.fecha_recepcion,
        "gmail_message_id": factura.gmail_message_id,
        "drive_file_id": factura.drive_file_id,
        "drive_url": factura.drive_url,
        "nombre_en_drive": factura.nombre_en_drive,
        "proveedor": proveedor,
        "clientes": clientes,
    }
