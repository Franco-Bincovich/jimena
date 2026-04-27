from googleapiclient.discovery import build
from sqlalchemy.orm import Session

from services import google_auth_service

_MIME_FOLDER = "application/vnd.google-apps.folder"


def verificar_carpeta(folder_id: str, db: Session) -> bool:
    """
    Verifica que la carpeta existe en Drive y el sistema tiene acceso.
    Usa files().get() con el folder_id.
    Devuelve True si existe y es accesible, False si no.

    Args:
        folder_id: ID de la carpeta en Google Drive.
        db: Sesión de base de datos (para obtener credenciales).
    """
    if not folder_id:
        return False
    try:
        credentials = google_auth_service.get_credentials(db)
        service = build("drive", "v3", credentials=credentials)
        service.files().get(fileId=folder_id, fields="id,mimeType").execute()
        return True
    except Exception:
        return False


def buscar_o_crear_carpeta(service, nombre: str, parent_id: str) -> str:
    """
    Busca una carpeta con ese nombre dentro del parent_id.
    Si no existe la crea. Nunca duplica — siempre buscar antes de crear.
    Devuelve el folder_id de la carpeta encontrada o creada.

    Args:
        service: Instancia del servicio de Drive ya autenticado.
        nombre: Nombre de la carpeta a buscar o crear.
        parent_id: ID de la carpeta padre donde buscar.
    """
    nombre_esc = nombre.replace("'", "\\'")
    query = (
        f"name='{nombre_esc}' and '{parent_id}' in parents "
        f"and mimeType='{_MIME_FOLDER}' and trashed=false"
    )
    resultado = service.files().list(q=query, fields="files(id)").execute()
    archivos = resultado.get("files", [])
    if archivos:
        return archivos[0]["id"]
    carpeta = service.files().create(
        body={"name": nombre, "mimeType": _MIME_FOLDER, "parents": [parent_id]},
        fields="id",
    ).execute()
    return carpeta["id"]
