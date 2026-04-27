import base64
import os
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional

from googleapiclient.discovery import build
from sqlalchemy.orm import Session

from services import google_auth_service
from utils.errors import AppError
from utils.logger import logger


def enviar_email(
    db: Session,
    destinatario_email: str,
    asunto: str,
    cuerpo: str,
    adjunto_path: Optional[str] = None,
    cc: Optional[List[str]] = None,
) -> str:
    """
    Construye un MIMEMultipart y lo envía via Gmail API.
    Si adjunto_path está presente y el archivo existe, lo adjunta como PDF.
    Si cc tiene emails, los agrega al header Cc del mensaje.

    Args:
        db: Sesión de base de datos (para obtener credenciales de Google).
        destinatario_email: Dirección de correo del destinatario.
        asunto: Asunto del email.
        cuerpo: Cuerpo del email en texto plano.
        adjunto_path: Ruta al PDF a adjuntar (opcional).
        cc: Lista de emails en copia (opcional).

    Returns:
        gmail_message_id del mensaje enviado.

    Raises:
        AppError EMAIL_SEND_FAILED 500 si falla el envío.
    """
    cc = cc or []
    credentials = google_auth_service.get_credentials(db)
    service = build("gmail", "v1", credentials=credentials)

    mensaje = MIMEMultipart()
    mensaje["To"] = destinatario_email
    mensaje["Subject"] = asunto
    if cc:
        mensaje["Cc"] = ", ".join(cc)
    mensaje.attach(MIMEText(cuerpo, "plain"))

    if adjunto_path and os.path.exists(adjunto_path):
        with open(adjunto_path, "rb") as f:
            parte = MIMEBase("application", "pdf")
            parte.set_payload(f.read())
        encoders.encode_base64(parte)
        parte.add_header(
            "Content-Disposition",
            f'attachment; filename="{os.path.basename(adjunto_path)}"',
        )
        mensaje.attach(parte)

    try:
        raw = base64.urlsafe_b64encode(mensaje.as_bytes()).decode()
        resultado = service.users().messages().send(userId="me", body={"raw": raw}).execute()
        gmail_message_id = resultado["id"]
        logger.info("Email enviado", extra={"destinatario": destinatario_email, "asunto": asunto})
        return gmail_message_id
    except Exception as exc:
        logger.error("Error al enviar email", extra={"destinatario": destinatario_email, "error": str(exc)})
        raise AppError("Error al enviar email", "EMAIL_SEND_FAILED", 500)
