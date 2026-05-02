from pydantic import BaseModel, ConfigDict


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    nombre: str
    email: str


class MeResponse(BaseModel):
    id: str
    email: str
    nombre: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class ChangePasswordRequest(BaseModel):
    password_actual: str
    password_nuevo: str
