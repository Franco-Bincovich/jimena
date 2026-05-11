from sqlalchemy.orm import Session

from models import Cliente
from repositories import cliente_repo
from schemas.cliente import ClienteCreate, ClienteUpdate
from utils.errors import AppError


def get_all(db: Session) -> list[Cliente]:
    """
    Retorna todos los clientes ordenados por nombre.

    Args:
        db: Sesión de base de datos.

    Returns:
        Lista de clientes.
    """
    return cliente_repo.find_all(db)


def get_by_id(db: Session, cliente_id: str) -> Cliente:
    """
    Retorna un cliente por ID.

    Args:
        db: Sesión de base de datos.
        cliente_id: UUID del cliente.

    Returns:
        Instancia de Cliente.

    Raises:
        AppError: code 'CLIENTE_NOT_FOUND' si el cliente no existe.
    """
    cliente = cliente_repo.find_by_id(db, cliente_id)
    if not cliente:
        raise AppError("Cliente no encontrado", "CLIENTE_NOT_FOUND", 404)
    return cliente


def buscar_por_cuit(db: Session, cuit: str) -> Cliente:
    """
    Busca un cliente por CUIT. Usado en el matching automático desde facturas.

    Args:
        db: Sesión de base de datos.
        cuit: CUIT del cliente a buscar.

    Returns:
        Cliente encontrado.

    Raises:
        AppError: code 'CLIENTE_NOT_FOUND' si no hay cliente con ese CUIT.
    """
    cliente = cliente_repo.find_by_cuit(db, cuit)
    if not cliente:
        raise AppError("Cliente no encontrado para ese CUIT", "CLIENTE_NOT_FOUND", 404)
    return cliente


def create(db: Session, data: ClienteCreate) -> Cliente:
    """
    Crea un cliente nuevo.

    Args:
        db: Sesión de base de datos.
        data: Datos validados del cliente.

    Returns:
        Cliente creado.

    Returns:
        Cliente creado.
    """
    return cliente_repo.create(db, data)


def update(db: Session, cliente_id: str, data: ClienteUpdate) -> Cliente:
    """
    Actualiza un cliente existente. Solo modifica los campos provistos.

    Args:
        db: Sesión de base de datos.
        cliente_id: UUID del cliente a actualizar.
        data: Campos a actualizar.

    Returns:
        Cliente actualizado.

    Raises:
        AppError: code 'CLIENTE_NOT_FOUND' si el cliente no existe.
    """
    get_by_id(db, cliente_id)
    return cliente_repo.update(db, cliente_id, data)


def delete(db: Session, cliente_id: str) -> None:
    """
    Elimina un cliente por ID.

    Args:
        db: Sesión de base de datos.
        cliente_id: UUID del cliente a eliminar.

    Raises:
        AppError: code 'CLIENTE_NOT_FOUND' si el cliente no existe.
    """
    get_by_id(db, cliente_id)
    cliente_repo.delete(db, cliente_id)
