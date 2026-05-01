from fastapi import APIRouter

from services import storage_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/limpiar-pdfs")
async def limpiar_pdfs():
    return storage_service.eliminar_pdfs_viejos(7)
