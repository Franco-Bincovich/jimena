import os
from datetime import datetime

from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from sqlalchemy.orm import Session

from repositories import google_config_repo
from services import drive_folder_service, google_auth_service
from utils.errors import AppError
from utils.logger import logger

_DRIVE_FILE_URL = "https://drive.google.com/file/d/{}/view"
_MIME_PDF = "application/pdf"


def verificar_carpeta(folder_id: str, db: Session) -> bool:
    """
    Verifica que la carpeta existe en Drive y el sistema tiene acceso.
    Devuelve True si existe, False si no.

    Args:
        folder_id: ID de la carpeta en Google Drive.
        db: Sesión de base de datos.
    """
    return drive_folder_service.verificar_carpeta(folder_id, db)


def subir_factura_proveedor(
    pdf_path: str, nombre_proveedor: str, nombre_archivo: str, db: Session
) -> dict:
    """
    Sube el PDF a: {carpeta_raiz}/Proveedores/{nombre_proveedor}/.
    Crea subcarpetas si no existen. Si ya existe un archivo con ese nombre
    en la carpeta destino, agrega timestamp para evitar colisiones.

    Args:
        pdf_path: Ruta local al PDF a subir.
        nombre_proveedor: Nombre de la subcarpeta del proveedor.
        nombre_archivo: Nombre base con el que se guardará en Drive.
        db: Sesión de base de datos.

    Returns:
        Dict con file_id, url y nombre_en_drive.

    Raises:
        AppError DRIVE_FOLDER_NOT_FOUND 404 si la carpeta raíz no está configurada.
        AppError DRIVE_UPLOAD_FAILED 500 si falla la subida.
    """
    credentials = google_auth_service.get_credentials(db)
    service = build("drive", "v3", credentials=credentials)
    config = google_config_repo.find(db)
    root_id = config.drive_folder_id if config else None
    if not root_id:
        raise AppError("Carpeta raíz de Drive no configurada", "DRIVE_FOLDER_NOT_FOUND", 404)

    try:
        prov_folder = drive_folder_service.buscar_o_crear_carpeta(service, "Proveedores", root_id)
        dest_folder = drive_folder_service.buscar_o_crear_carpeta(service, nombre_proveedor, prov_folder)

        nombre_esc = nombre_archivo.replace("'", "\\'")
        q = f"name='{nombre_esc}' and '{dest_folder}' in parents and trashed=false"
        if service.files().list(q=q, fields="files(id)").execute().get("files"):
            base, ext = os.path.splitext(nombre_archivo)
            nombre_final = f"{base}_{datetime.now().strftime('%Y%m%d%H%M%S')}{ext}"
        else:
            nombre_final = nombre_archivo

        media = MediaFileUpload(pdf_path, mimetype=_MIME_PDF, resumable=False)
        archivo = service.files().create(
            body={"name": nombre_final, "parents": [dest_folder]},
            media_body=media,
            fields="id",
        ).execute()
        file_id = archivo["id"]
        return {"file_id": file_id, "url": _DRIVE_FILE_URL.format(file_id), "nombre_en_drive": nombre_final}
    except AppError:
        raise
    except Exception as exc:
        logger.error("Error subiendo factura a Drive", extra={"pdf_path": pdf_path, "error": str(exc)})
        raise AppError("Error al subir factura a Drive", "DRIVE_UPLOAD_FAILED", 500)


def copiar_factura_cliente(file_id: str, nombre_cliente: str, db: Session) -> dict:
    """
    Copia el archivo ya existente en Drive a: {carpeta_raiz}/Clientes/{nombre_cliente}/.
    Usa files().copy() en vez de re-subir el binario.

    Args:
        file_id: ID del archivo en Drive a copiar.
        nombre_cliente: Nombre de la subcarpeta del cliente.
        db: Sesión de base de datos.

    Returns:
        Dict con file_id y url del archivo copiado.

    Raises:
        AppError DRIVE_FOLDER_NOT_FOUND 404 si la carpeta raíz no está configurada.
        AppError DRIVE_UPLOAD_FAILED 500 si falla la copia.
    """
    credentials = google_auth_service.get_credentials(db)
    service = build("drive", "v3", credentials=credentials)
    config = google_config_repo.find(db)
    root_id = config.drive_folder_id if config else None
    if not root_id:
        raise AppError("Carpeta raíz de Drive no configurada", "DRIVE_FOLDER_NOT_FOUND", 404)

    try:
        cli_folder = drive_folder_service.buscar_o_crear_carpeta(service, "Clientes", root_id)
        dest_folder = drive_folder_service.buscar_o_crear_carpeta(service, nombre_cliente, cli_folder)
        copia = service.files().copy(
            fileId=file_id,
            body={"parents": [dest_folder]},
            fields="id",
        ).execute()
        new_id = copia["id"]
        return {"file_id": new_id, "url": _DRIVE_FILE_URL.format(new_id)}
    except AppError:
        raise
    except Exception as exc:
        logger.error("Error copiando factura en Drive", extra={"file_id": file_id, "error": str(exc)})
        raise AppError("Error al copiar factura en Drive", "DRIVE_UPLOAD_FAILED", 500)


def descargar_pdf(file_id: str, nombre_archivo: str, db: Session) -> str:
    """
    Descarga un PDF desde Drive al directorio uploads/ local.

    Args:
        file_id: ID del archivo en Google Drive.
        nombre_archivo: Nombre con el que se guardará en uploads/.
        db: Sesión de base de datos.

    Returns:
        Ruta local al PDF descargado. Raises AppError DRIVE_DOWNLOAD_FAILED 500 si falla.
    """
    credentials = google_auth_service.get_credentials(db)
    service = build("drive", "v3", credentials=credentials)
    try:
        data = service.files().get_media(fileId=file_id).execute()
        local_path = os.path.join("uploads", nombre_archivo)
        with open(local_path, "wb") as f:
            f.write(data)
        return local_path
    except AppError:
        raise
    except Exception as exc:
        logger.error("Error descargando PDF de Drive", extra={"file_id": file_id, "error": str(exc)})
        raise AppError("Error al descargar PDF de Drive", "DRIVE_DOWNLOAD_FAILED", 500)
