import os
from datetime import datetime, timedelta, timezone
from urllib.parse import quote

from supabase import Client, create_client

from config.settings import settings
from utils.logger import logger

BUCKET = "Facturas"


def get_supabase_client() -> Client:
    """Inicializa y devuelve el cliente de Supabase usando SUPABASE_URL y SUPABASE_SERVICE_KEY."""
    return create_client(settings.supabase_url, settings.supabase_service_key)


def build_storage_key(factura_id: str) -> str:
    """
    Construye la clave interna y única de Storage para una factura.
    Formato limpio y URL-safe (nunca contiene el nombre visible con % del usuario).

    Returns: Clave de objeto dentro del bucket, ej. 'facturas/{id}.pdf'.
    """
    return f"facturas/{factura_id}.pdf"


def subir_pdf(file_path: str, storage_key: str) -> str:
    """
    Sube un PDF desde file_path al bucket 'Facturas' bajo la storage_key indicada.
    Después de subir exitosamente, borra el archivo local de /tmp.
    No captura errores: si la subida falla, propaga la excepción al caller.

    Returns: URL pública del objeto subido.
    """
    client = get_supabase_client()
    with open(file_path, "rb") as f:
        pdf_bytes = f.read()

    client.storage.from_(BUCKET).upload(
        storage_key, pdf_bytes, {"content-type": "application/pdf"}
    )
    url = client.storage.from_(BUCKET).get_public_url(storage_key).rstrip("?")

    if os.path.exists(file_path):
        os.remove(file_path)
    logger.info("PDF subido a Supabase Storage", extra={"storage_key": storage_key})
    return url


def descargar_pdf(storage_key: str) -> bytes:
    """
    Descarga un PDF desde el bucket 'Facturas' por su storage_key.
    quote(safe="/") protege claves legacy que puedan contener '%' u otros chars no seguros
    (registros viejos rellenados con el nombre original). Asume que storage3 NO re-encodea
    el path: pasa la key cruda a httpx, por eso la encodeamos nosotros acá.

    Returns: Bytes del archivo PDF.
    """
    client = get_supabase_client()
    return client.storage.from_(BUCKET).download(quote(storage_key, safe="/"))


def eliminar_pdf(nombre_archivo: str) -> bool:
    """
    Elimina un PDF del bucket 'Facturas' en Supabase Storage.

    Returns: True si el archivo fue eliminado, False si no existía o hubo error.
    """
    if not nombre_archivo:
        return False
    client = get_supabase_client()
    try:
        client.storage.from_(BUCKET).remove([nombre_archivo])
        logger.info("PDF eliminado de Supabase Storage", extra={"archivo": nombre_archivo})
        return True
    except Exception as exc:
        logger.error(
            "Error eliminando PDF de Supabase Storage",
            extra={"archivo": nombre_archivo, "error": str(exc)},
        )
        return False


def listar_pdfs_viejos(dias: int = 7) -> list[str]:
    """
    Lista los archivos en el bucket 'Facturas' con más de {dias} días de antigüedad.

    Returns: Lista de nombres de archivo que superan la antigüedad indicada.
    """
    client = get_supabase_client()
    files = client.storage.from_(BUCKET).list()
    ahora = datetime.now(timezone.utc)
    limite = timedelta(days=dias)
    viejos: list[str] = []
    for f in files:
        created_at = f.get("created_at") if isinstance(f, dict) else getattr(f, "created_at", None)
        nombre = f.get("name") if isinstance(f, dict) else getattr(f, "name", None)
        if not created_at or not nombre:
            continue
        try:
            fecha = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            if (ahora - fecha) >= limite:
                viejos.append(nombre)
        except Exception:
            pass
    return viejos


def eliminar_pdfs_viejos(dias: int = 7) -> dict:
    """
    Elimina todos los archivos del bucket 'Facturas' con más de {dias} días de antigüedad.
    Llama a listar_pdfs_viejos() para obtener la lista y elimina cada uno.

    Returns: Dict con {eliminados: int, errores: int}.
    """
    archivos = listar_pdfs_viejos(dias)
    eliminados = 0
    errores = 0
    for nombre in archivos:
        if eliminar_pdf(nombre):
            eliminados += 1
        else:
            errores += 1
    logger.info(
        "Limpieza de PDFs viejos completada",
        extra={"eliminados": eliminados, "errores": errores},
    )
    return {"eliminados": eliminados, "errores": errores}
