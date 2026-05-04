from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from schemas.config import ConfigResponse, ConfigUpdate
from services import config_service, drive_service, sheets_service
from utils.errors import AppError

router = APIRouter(prefix="/config", tags=["config"])


class VerificarDriveBody(BaseModel):
    drive_folder_id: str


class VerificarSheetBody(BaseModel):
    sheet_id: str


@router.get("", response_model=ConfigResponse)
async def get_config(db: Session = Depends(get_db)):
    return config_service.get_config(db)


@router.put("", response_model=ConfigResponse)
async def update_config(data: ConfigUpdate, db: Session = Depends(get_db)):
    return config_service.update_config(db, data)


@router.post("/verificar-drive")
async def verificar_drive(body: VerificarDriveBody, db: Session = Depends(get_db)):
    config_service.update_config(db, ConfigUpdate(drive_folder_id=body.drive_folder_id))
    ok = drive_service.verificar_carpeta(body.drive_folder_id, db)
    if not ok:
        raise AppError("Carpeta de Drive inaccesible o no encontrada", "DRIVE_FOLDER_NOT_FOUND", 404)
    return {"ok": True, "mensaje": "Carpeta de Drive accesible"}


@router.post("/verificar-sheet")
async def verificar_sheet(body: VerificarSheetBody, db: Session = Depends(get_db)):
    config_service.update_config(db, ConfigUpdate(sheet_id=body.sheet_id))
    ok = sheets_service.verificar_sheet(body.sheet_id, db)
    if not ok:
        raise AppError("Sheet inaccesible o no encontrado", "SHEET_NOT_FOUND", 404)
    return {"ok": True, "mensaje": "Sheet accesible"}


@router.post("/crear-sheet")
async def crear_sheet(db: Session = Depends(get_db)):
    cfg = config_service.get_config(db)
    nombre = cfg.get("empresa_nombre") or "Facturas"
    sheet_id = sheets_service.crear_sheet(nombre, db)
    return {"ok": True, "sheet_id": sheet_id}
