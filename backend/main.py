from fastapi import Depends, FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

import models  # noqa: F401 — registra los modelos en Base.metadata
from config.settings import settings
from database import Base
from middleware.error_handler import app_error_handler, unexpected_error_handler
from routers import clientes, contactos_cc, envios, facturas, pedidos, plantillas, proveedores
from routers import auth as auth_router
from routers import google_auth
from routers import admin as admin_router
from routers import config as config_router
from utils.auth import get_current_user
from utils.errors import AppError

_ALLOWED_ORIGINS = {o.strip() for o in settings.allowed_origins.split(",") if o.strip()}
_MAX_PAYLOAD_BYTES = 10 * 1024 * 1024  # 10 MB — cubre PDFs adjuntos


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return response


app = FastAPI(title="Sistema Facturas", version="0.1.0")
app.add_middleware(SecurityHeadersMiddleware)


@app.middleware("http")
async def limit_payload_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > _MAX_PAYLOAD_BYTES:
        return JSONResponse(
            status_code=413,
            content={"error": True, "message": "Payload demasiado grande", "code": "PAYLOAD_TOO_LARGE"},
        )
    return await call_next(request)


@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    origin = request.headers.get("origin", "")
    allow_origin = origin if origin in _ALLOWED_ORIGINS else ""

    if request.method == "OPTIONS":
        response = Response()
        response.headers["Access-Control-Allow-Origin"] = allow_origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response
    response = await call_next(request)
    if allow_origin:
        response.headers["Access-Control-Allow-Origin"] = allow_origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "*"
    return response


app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(Exception, unexpected_error_handler)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

_auth_dep = [Depends(get_current_user)]

app.include_router(auth_router.router, prefix="/api")
app.include_router(google_auth.router, prefix="/api")
app.include_router(proveedores.router, prefix="/api", dependencies=_auth_dep)
app.include_router(clientes.router, prefix="/api", dependencies=_auth_dep)
app.include_router(contactos_cc.router, prefix="/api", dependencies=_auth_dep)
app.include_router(plantillas.router, prefix="/api", dependencies=_auth_dep)
app.include_router(config_router.router, prefix="/api", dependencies=_auth_dep)
app.include_router(facturas.router, prefix="/api", dependencies=_auth_dep)
app.include_router(pedidos.router, prefix="/api", dependencies=_auth_dep)
app.include_router(envios.router, prefix="/api", dependencies=_auth_dep)
app.include_router(admin_router.router, prefix="/api", dependencies=_auth_dep)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
