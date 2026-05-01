from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from schemas.auth import ChangePasswordRequest, LoginRequest, MeResponse, TokenResponse
from services import auth_service
from utils.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    return auth_service.login(db, body.email, body.password)


@router.get("/me", response_model=MeResponse)
def me(current_user=Depends(get_current_user)):
    return current_user


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    body: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    auth_service.change_password(db, current_user, body.password_actual, body.password_nuevo)
