from datetime import datetime, timedelta

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from config.settings import settings
from database import get_db

_ALGORITHM = "HS256"
_EXPIRE_HOURS = 8

_bearer = HTTPBearer()


def create_access_token(user_id: str, nombre: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=_EXPIRE_HOURS)
    payload = {"sub": user_id, "nombre": nombre, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=_ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
):
    """Dependencia FastAPI: valida JWT y devuelve el User autenticado."""
    from repositories import user_repo

    try:
        payload = jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=[_ALGORITHM])
        user_id: str = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido")

    user = user_repo.get_by_id(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Usuario no autorizado")

    return user
