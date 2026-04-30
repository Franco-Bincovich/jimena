from sqlalchemy.orm import Session
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow

from repositories import google_config_repo
from utils.errors import AppError

SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets",
]
_TOKEN_URI = "https://oauth2.googleapis.com/token"
_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


def get_flow() -> Flow:
    """
    Construye el Flow de OAuth 2.0 para web desde la configuración en settings.
    El import de settings es lazy para que el servidor arranque sin credenciales Google.

    Returns:
        Flow listo para generar URL de autorización o intercambiar tokens.

    Raises:
        AppError: code 'GOOGLE_NOT_CONFIGURED' si CLIENT_ID o CLIENT_SECRET están vacíos.
    """
    from config.settings import settings  # lazy — validado solo al usarse

    if not settings.google_client_id or not settings.google_client_secret:
        raise AppError(
            "Credenciales de Google no configuradas en el servidor.",
            "GOOGLE_NOT_CONFIGURED",
            400,
        )

    client_config = {
        "web": {
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uris": [settings.google_redirect_uri],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": _TOKEN_URI,
        }
    }
    flow = Flow.from_client_config(client_config, scopes=SCOPES)
    flow.redirect_uri = settings.google_redirect_uri
    return flow


def get_credentials(db: Session) -> Credentials:
    """
    Lee los tokens de GoogleConfig, refresca el access_token y devuelve Credentials listas.

    Args:
        db: Sesión de base de datos.

    Returns:
        Credentials de google-auth listas para llamadas a la API.

    Raises:
        AppError: code 'GOOGLE_NOT_CONNECTED' si no hay refresh_token en DB.
    """
    config = google_config_repo.find(db)
    if not config or not config.refresh_token:
        raise AppError("Google no conectado", "GOOGLE_NOT_CONNECTED", 403)

    from config.settings import settings  # lazy — solo se necesita cuando hay refresh_token

    credentials = Credentials(
        token=config.access_token,
        refresh_token=config.refresh_token,
        token_uri=_TOKEN_URI,
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        scopes=SCOPES,
    )

    credentials.refresh(Request())
    google_config_repo.upsert(db, {
        "access_token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_expiry": credentials.expiry,
    })

    return credentials
