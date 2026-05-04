from googleapiclient.discovery import build
from sqlalchemy.orm import Session

from repositories import google_config_repo
from services import google_auth_service
from utils.errors import AppError

_HEADERS = [
    "Proyecto", "CUIT", "Mes/Año", "Proveedor", "Consumos",
    "Factura", "Pago", "Retencion", "Monto", "Mail",
]


def verificar_sheet(sheet_id: str, db: Session) -> bool:
    """
    Verifica que el Sheet existe y el sistema tiene acceso.
    Devuelve True si existe y es accesible, False si no.

    Args:
        sheet_id: ID del Google Sheet a verificar.
        db: Sesión de base de datos (para obtener credenciales).
    """
    if not sheet_id:
        return False
    try:
        credentials = google_auth_service.get_credentials(db)
        service = build("sheets", "v4", credentials=credentials)
        service.spreadsheets().get(spreadsheetId=sheet_id).execute()
        return True
    except Exception:
        return False


def crear_sheet(nombre: str, db: Session) -> str:
    """
    Crea un nuevo Google Sheet con el nombre dado.
    Escribe los headers en la primera fila y guarda el sheet_id en GoogleConfig.

    Args:
        nombre: Nombre del nuevo Google Sheet.
        db: Sesión de base de datos.

    Returns:
        sheet_id del Sheet creado.
    """
    credentials = google_auth_service.get_credentials(db)
    service = build("sheets", "v4", credentials=credentials)
    resultado = service.spreadsheets().create(
        body={"properties": {"title": nombre}}, fields="spreadsheetId"
    ).execute()
    sheet_id = resultado["spreadsheetId"]
    _inicializar_headers(service, sheet_id)
    google_config_repo.upsert(db, {"sheet_id": sheet_id})
    return sheet_id


def _inicializar_headers(service, sheet_id: str) -> None:
    """
    Si la primera fila está vacía, escribe los headers:
    Fecha | Hora | Tipo | Proyecto | CUIT | Mes/Año | Proveedor |
    Consumos API | Factura | Link Drive | Monto | Estado | Email Destinatario.
    """
    resp = service.spreadsheets().values().get(
        spreadsheetId=sheet_id, range="A1:J1"
    ).execute()
    if resp.get("values"):
        return
    service.spreadsheets().values().update(
        spreadsheetId=sheet_id,
        range="A1",
        valueInputOption="RAW",
        body={"values": [_HEADERS]},
    ).execute()
