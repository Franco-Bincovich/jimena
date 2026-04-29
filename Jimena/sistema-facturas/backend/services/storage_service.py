import os
from datetime import datetime, timedelta, timezone

from supabase import Client, create_client

from config.settings import settings
from utils.logger import logger

BUCKET = "Facturas"


def get_supabase_client() -> Client:
    """Inicializa y devuelve el cliente de Supabase usando SUPABASE_URL y SUPABASE_SERVICE_KEY."""
    return create_client(settings.supabase_url, settings.supabase_service_key)


def subir_pdf(file_path: str, nombre_destino: str) -> str:
    """
    Sube un PDF desde file_path al bucket 'Facturas' en Supabase Storage.
    Si ya existe un archivo con ese nombre, agrega un timestamp al nombre para evitar colisiones.
    Después de subir exitosamente, borra el archivo local de uploads/.

    Returns: URL pública del archivo subido.
    """
    client = get_supabase_client()
    with open(file_path, "rb") as f:
        pdf_bytes = f.read()

    try:
        client.storage.from_(BUCKET).upload(
            nombre_destino, pdf_bytes, {"content-type": "application/pdf"}
        )
    except Exception:
        base, ext = os.path.splitext(nombre_destino)
        ts = int(datetime.now(timezone.utc).timestamp())
        nombre_destino = f"{base}_{ts}{ext}"
        client.storage.from_(BUCKET).upload(
            nombre_destino, pdf_bytes, {"content-type": "application/pdf"}
        )

    url = client.storage.from_(BUCKET).get_public_url(nombre_destino)

    if os.path.exists(file_path):
        os.remove(file_path)
    logger.info("PDF subido a Supabase Storage", extra={"archivo": nombre_destino})
    return url


def descargar_pdf(nombre_archivo: str) -> bytes:
    """
    Descarga un PDF desde el bucket 'Facturas' en Supabase Storage.

    Returns: Bytes del archivo PDF.
    """
    client = get_supabase_client()
    return client.storage.from_(BUCKET).download(nombre_archivo)


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
