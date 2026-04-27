from typing import Optional

from sqlalchemy.orm import Session

from models import Plantilla
from repositories import plantilla_repo
from schemas.plantilla import TIPOS_VALIDOS, PlantillaCreate, PlantillaUpdate
from utils.errors import AppError


def get_all(db: Session, tipo: Optional[str] = None) -> list[Plantilla]:
    """
    Retorna todas las plantillas, opcionalmente filtradas por tipo.

    Args:
        db: Sesión de base de datos.
        tipo: Filtro opcional. Valores aceptados: 'pedido' | 'envio'.

    Returns:
        Lista de plantillas ordenada por nombre.

    Raises:
        AppError: code 'INVALID_TIPO' si tipo no es un valor válido.
    """
    if tipo is not None and tipo not in TIPOS_VALIDOS:
        raise AppError(
            "Tipo inválido. Debe ser 'pedido' o 'envio'", "INVALID_TIPO", 400
        )
    if tipo:
        return plantilla_repo.find_by_tipo(db, tipo)
    return plantilla_repo.find_all(db)


def get_by_id(db: Session, plantilla_id: str) -> Plantilla:
    """
    Retorna una plantilla por ID.

    Args:
        db: Sesión de base de datos.
        plantilla_id: UUID de la plantilla.

    Returns:
        Instancia de Plantilla.

    Raises:
        AppError: code 'PLANTILLA_NOT_FOUND' si la plantilla no existe.
    """
    plantilla = plantilla_repo.find_by_id(db, plantilla_id)
    if not plantilla:
        raise AppError("Plantilla no encontrada", "PLANTILLA_NOT_FOUND", 404)
    return plantilla


def create(db: Session, data: PlantillaCreate) -> Plantilla:
    """
    Crea una plantilla nueva.

    Args:
        db: Sesión de base de datos.
        data: Datos validados de la plantilla.

    Returns:
        Plantilla creada.
    """
    return plantilla_repo.create(db, data)


def update(db: Session, plantilla_id: str, data: PlantillaUpdate) -> Plantilla:
    """
    Actualiza una plantilla existente. Solo modifica los campos provistos.

    Args:
        db: Sesión de base de datos.
        plantilla_id: UUID de la plantilla a actualizar.
        data: Campos a actualizar.

    Returns:
        Plantilla actualizada.

    Raises:
        AppError: code 'PLANTILLA_NOT_FOUND' si la plantilla no existe.
    """
    get_by_id(db, plantilla_id)
    return plantilla_repo.update(db, plantilla_id, data)


def delete(db: Session, plantilla_id: str) -> None:
    """
    Elimina una plantilla por ID.

    Args:
        db: Sesión de base de datos.
        plantilla_id: UUID de la plantilla a eliminar.

    Raises:
        AppError: code 'PLANTILLA_NOT_FOUND' si la plantilla no existe.
    """
    get_by_id(db, plantilla_id)
    plantilla_repo.delete(db, plantilla_id)
