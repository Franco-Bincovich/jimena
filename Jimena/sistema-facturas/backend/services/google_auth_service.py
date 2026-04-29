import os
from typing import Optional

import requests as http_client
from sqlalchemy.orm import Session

from models import GoogleConfig
from repositories import google_config_repo
from services.google_credentials_service import (  # noqa: F401 — re-exportado para callers existentes
    _USERINFO_URL,
    get_credentials,
    get_flow,
)
from utils.errors import AppError
from utils.logger import logger
from config.settings import settings as _settings

if _settings.oauthlib_insecure_transport == "1":
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"
os.environ["OAUTHLIB_RELAX_TOKEN_SCOPE"] = "1"


def get_authorization_url(db: Session) -> str:
    """
    Genera la URL de autorización de Google OAuth 2.0.
    Persiste el state anti-CSRF en GoogleConfig (upsert id=1).

    Args:
        db: Sesión de base de datos.

    Returns:
        URL de Google Accounts para iniciar el flujo OAuth.
    """
    flow = get_flow()
    auth_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    google_config_repo.upsert(db, {"oauth_state": state})
    return auth_url


def handle_callback(code: str, state: str, db: Session) -> GoogleConfig:
    """
    Valida el state CSRF, intercambia el code por tokens y persiste la sesión.
    Obtiene el email de la cuenta via Google userinfo. Nunca loguea los tokens.

    Args:
        code: Código de autorización recibido de Google.
        state: Valor anti-CSRF a validar contra el guardado en DB.
        db: Sesión de base de datos.

    Returns:
        GoogleConfig actualizado con tokens y google_email.

    Raises:
        AppError: code 'INVALID_OAUTH_STATE' si el state no coincide.
        AppError: code 'OAUTH_FAILED' si el intercambio de tokens falla.
    """
    config = google_config_repo.find(db)
    if not config or config.oauth_state != state:
        raise AppError("Estado OAuth inválido", "INVALID_OAUTH_STATE", 400)

    try:
        flow = get_flow()
        flow.fetch_token(code=code)
        credentials = flow.credentials
    except AppError:
        raise
    except Exception as exc:
        logger.error("Error en intercambio de tokens OAuth", extra={"error": str(exc)})
        raise AppError("Error en autenticación con Google", "OAUTH_FAILED", 500)

    resp = http_client.get(
        _USERINFO_URL,
        headers={"Authorization": f"Bearer {credentials.token}"},
        timeout=10,
    )
    google_email: Optional[str] = resp.json().get("email") if resp.ok else None

    return google_config_repo.upsert(db, {
        "access_token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_expiry": credentials.expiry,
        "google_email": google_email,
        "oauth_state": None,
    })


def get_status(db: Session) -> dict:
    """
    Devuelve el estado de conexión de Google. No requiere settings en el servidor.

    Args:
        db: Sesión de base de datos.

    Returns:
        Diccionario con 'connected' (bool) y 'email' (str o None).
    """
    config = google_config_repo.find(db)
    connected = config is not None and config.refresh_token is not None
    return {
        "connected": connected,
        "email": config.google_email if connected else None,
    }


def disconnect(db: Session) -> None:
    """
    Elimina los tokens de GoogleConfig desconectando la cuenta de Google.
    Conserva sheet_id, drive_folder_id y el resto de la configuración.

    Args:
        db: Sesión de base de datos.
    """
    google_config_repo.upsert(db, {
        "access_token": None,
        "refresh_token": None,
        "token_expiry": None,
        "google_email": None,
    })
