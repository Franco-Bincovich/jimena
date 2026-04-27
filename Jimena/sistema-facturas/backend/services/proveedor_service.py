from sqlalchemy.orm import Session

from models import Proveedor
from repositories import proveedor_repo
from schemas.proveedor import ProveedorCreate, ProveedorUpdate
from utils.errors import AppError


def get_all(db: Session) -> list[Proveedor]:
    """
    Retorna todos los proveedores ordenados por nombre.

    Args:
        db: Sesión de base de datos.

    Returns:
        Lista de proveedores.
    """
    return proveedor_repo.find_all(db)


def get_by_id(db: Session, proveedor_id: str) -> Proveedor:
    """
    Retorna un proveedor por ID.

    Args:
        db: Sesión de base de datos.
        proveedor_id: UUID del proveedor.

    Returns:
        Instancia de Proveedor.

    Raises:
        AppError: code 'PROVEEDOR_NOT_FOUND' si el proveedor no existe.
    """
    proveedor = proveedor_repo.find_by_id(db, proveedor_id)
    if not proveedor:
        raise AppError("Proveedor no encontrado", "PROVEEDOR_NOT_FOUND", 404)
    return proveedor


def create(db: Session, data: ProveedorCreate) -> Proveedor:
    """
    Crea un proveedor nuevo.

    Args:
        db: Sesión de base de datos.
        data: Datos validados del proveedor.

    Returns:
        Proveedor creado.

    Raises:
        AppError: code 'DUPLICATE_EMAIL' si el email ya existe.
    """
    if data.email and proveedor_repo.find_by_email(db, data.email):
        raise AppError("El email ya está registrado", "DUPLICATE_EMAIL", 409)
    return proveedor_repo.create(db, data)


def update(db: Session, proveedor_id: str, data: ProveedorUpdate) -> Proveedor:
    """
    Actualiza un proveedor existente. Solo modifica los campos provistos.

    Args:
        db: Sesión de base de datos.
        proveedor_id: UUID del proveedor a actualizar.
        data: Campos a actualizar.

    Returns:
        Proveedor actualizado.

    Raises:
        AppError: code 'PROVEEDOR_NOT_FOUND' si el proveedor no existe.
        AppError: code 'DUPLICATE_EMAIL' si el email pertenece a otro proveedor.
    """
    get_by_id(db, proveedor_id)
    if "email" in data.model_fields_set and data.email:
        existing = proveedor_repo.find_by_email(db, data.email)
        if existing and existing.id != proveedor_id:
            raise AppError("El email ya está registrado", "DUPLICATE_EMAIL", 409)
    return proveedor_repo.update(db, proveedor_id, data)


def delete(db: Session, proveedor_id: str) -> None:
    """
    Elimina un proveedor por ID.

    Args:
        db: Sesión de base de datos.
        proveedor_id: UUID del proveedor a eliminar.

    Raises:
        AppError: code 'PROVEEDOR_NOT_FOUND' si el proveedor no existe.
    """
    get_by_id(db, proveedor_id)
    proveedor_repo.delete(db, proveedor_id)
