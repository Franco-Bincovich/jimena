import os
from typing import Optional

from repositories import factura_repo
from utils.logger import logger


def to_dict(factura) -> dict:
    """Serializa una instancia Factura a dict con proveedor y clientes anidados."""
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


def intentar_subida_drive(factura_id: str, nombre_archivo: str, nombre_proveedor: str, db) -> None:
    """Sube el PDF a Drive (best-effort). Si falla, loguea el error y continúa."""
    try:
        from services import drive_service  # lazy — evita importación circular
        pdf_path = os.path.join("/tmp", nombre_archivo)
        resultado = drive_service.subir_factura_proveedor(pdf_path, nombre_proveedor, nombre_archivo, db)
        factura_repo.update(db, factura_id, {
            "drive_file_id": resultado["file_id"],
            "drive_url": resultado["url"],
            "nombre_en_drive": resultado["nombre_en_drive"],
        })
    except Exception as exc:
        logger.error("Error subiendo a Drive (best-effort)", extra={"factura_id": factura_id, "error": str(exc)})


def intentar_url_supabase(factura_id: str, nombre_archivo: str, db) -> None:
    """Actualiza drive_url con la URL pública de Supabase Storage como fallback."""
    try:
        from services import storage_service  # lazy — evita importación circular
        client = storage_service.get_supabase_client()
        url = client.storage.from_("Facturas").get_public_url(nombre_archivo)
        factura_repo.update(db, factura_id, {"drive_url": url})
    except Exception as exc:
        logger.error("Error obteniendo URL de Supabase Storage", extra={"factura_id": factura_id, "error": str(exc)})
