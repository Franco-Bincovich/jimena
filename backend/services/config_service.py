from sqlalchemy.orm import Session

from repositories import google_config_repo
from schemas.config import ConfigUpdate


def get_config(db: Session) -> dict:
    """
    Devuelve la configuración actual del sistema sin exponer tokens.

    Args:
        db: Sesión de base de datos.

    Returns:
        Diccionario con los campos de configuración y el estado de conexión.
    """
    config = google_config_repo.find(db)
    if config is None:
        return {
            "sheet_id": None,
            "drive_folder_id": None,
            "empresa_nombre": None,
            "empresa_email": None,
            "google_email": None,
            "connected": False,
        }
    return {
        "sheet_id": config.sheet_id,
        "drive_folder_id": config.drive_folder_id,
        "empresa_nombre": config.empresa_nombre,
        "empresa_email": config.empresa_email,
        "google_email": config.google_email,
        "connected": config.refresh_token is not None,
    }


def update_config(db: Session, data: ConfigUpdate) -> dict:
    """
    Actualiza los campos de configuración del sistema (upsert sobre GoogleConfig id=1).

    Args:
        db: Sesión de base de datos.
        data: Campos a actualizar. Solo se modifican los provistos.

    Returns:
        Configuración actualizada sin tokens.
    """
    google_config_repo.upsert(db, data.model_dump(exclude_unset=True))
    return get_config(db)
