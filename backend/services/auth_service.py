import bcrypt
from sqlalchemy.orm import Session

from repositories import user_repo
from utils.auth import create_access_token
from utils.errors import AppError


def login(db: Session, email: str, password: str) -> dict:
    """Verifica credenciales y devuelve token JWT."""
    user = user_repo.get_by_email(db, email)
    if not user or not user.is_active:
        raise AppError("Credenciales inválidas", "INVALID_CREDENTIALS", 401)

    if not bcrypt.checkpw(password.encode("utf-8"), user.password_hash.encode("utf-8")):
        raise AppError("Credenciales inválidas", "INVALID_CREDENTIALS", 401)

    token = create_access_token(str(user.id), user.nombre)
    return {
        "access_token": token,
        "token_type": "bearer",
        "nombre": user.nombre,
        "email": user.email,
    }


def change_password(db: Session, user, password_actual: str, password_nuevo: str) -> None:
    """Cambia la contraseña del usuario autenticado."""
    if not bcrypt.checkpw(password_actual.encode("utf-8"), user.password_hash.encode("utf-8")):
        raise AppError("Contraseña actual incorrecta", "WRONG_PASSWORD", 400)

    new_hash = bcrypt.hashpw(password_nuevo.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user_repo.update_password_hash(db, user, new_hash)
