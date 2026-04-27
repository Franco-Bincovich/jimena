from fastapi import Request
from fastapi.responses import JSONResponse

from utils.errors import AppError
from utils.logger import logger


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    logger.warning(
        exc.message,
        extra={"code": exc.code, "path": str(request.url.path)},
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": True, "message": exc.message, "code": exc.code},
    )


async def unexpected_error_handler(request: Request, exc: Exception) -> JSONResponse:
    # Error inesperado — loguear completo pero no exponer detalle al cliente
    logger.error(
        "Error inesperado",
        extra={"error": str(exc), "path": str(request.url.path)},
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "message": "Error interno del servidor",
            "code": "INTERNAL_ERROR",
        },
    )
