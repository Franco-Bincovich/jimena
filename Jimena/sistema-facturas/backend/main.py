from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from starlette.responses import Response

import models  # noqa: F401 — registra los modelos en Base.metadata
from database import Base, engine
from middleware.error_handler import app_error_handler, unexpected_error_handler
from routers import clientes, contactos_cc, envios, facturas, pedidos, plantillas, proveedores
from routers import google_auth
from routers import config as config_router
from utils.errors import AppError

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sistema Facturas", version="0.1.0")


@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        response = Response()
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response


app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(Exception, unexpected_error_handler)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(proveedores.router, prefix="/api")
app.include_router(clientes.router, prefix="/api")
app.include_router(contactos_cc.router, prefix="/api")
app.include_router(plantillas.router, prefix="/api")
app.include_router(google_auth.router, prefix="/api")
app.include_router(config_router.router, prefix="/api")
app.include_router(facturas.router, prefix="/api")
app.include_router(pedidos.router, prefix="/api")
app.include_router(envios.router, prefix="/api")


@app.get("/health")
async def health_check():
    return {"status": "ok"}
