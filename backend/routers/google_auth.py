import traceback

from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from config.settings import settings
from database import get_db
from services import google_auth_service
from utils.logger import logger

router = APIRouter(prefix="/auth/google", tags=["google-auth"])


@router.get("/url")
async def get_auth_url(db: Session = Depends(get_db)):
    url = google_auth_service.get_authorization_url(db)
    return {"url": url}


@router.get("/callback")
async def google_callback(code: str, state: str, db: Session = Depends(get_db)):
    try:
        google_auth_service.handle_callback(code, state, db)
        return RedirectResponse(url=f"{settings.frontend_url}/configuracion?connected=true")
    except Exception:
        logger.error("OAuth callback error", extra={"error": traceback.format_exc()})
        return RedirectResponse(url=f"{settings.frontend_url}/configuracion?error=oauth_failed")


@router.get("/status")
async def google_status(db: Session = Depends(get_db)):
    return google_auth_service.get_status(db)


@router.post("/disconnect")
async def google_disconnect(db: Session = Depends(get_db)):
    google_auth_service.disconnect(db)
    return {"ok": True}
