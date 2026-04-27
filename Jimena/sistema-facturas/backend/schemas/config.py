from typing import Optional

from pydantic import BaseModel, EmailStr


class ConfigUpdate(BaseModel):
    sheet_id: Optional[str] = None
    empresa_nombre: Optional[str] = None
    empresa_email: Optional[EmailStr] = None
    drive_folder_id: Optional[str] = None


class ConfigResponse(BaseModel):
    sheet_id: Optional[str]
    drive_folder_id: Optional[str]
    empresa_nombre: Optional[str]
    empresa_email: Optional[str]
    google_email: Optional[str]
    connected: bool
