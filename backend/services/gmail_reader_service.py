import base64, json, os
from io import BytesIO
from typing import Optional

import anthropic
from googleapiclient.discovery import build
from pdf2image import convert_from_path
from sqlalchemy.orm import Session

from repositories import cliente_repo, factura_repo, proveedor_repo
from services import google_auth_service
from utils.logger import logger

_UPLOADS = "uploads"
_SYSTEM_PROMPT = "Eres un extractor de datos de facturas. Devuelve ÚNICAMENTE un JSON válido con estos campos: numero_factura (str), fecha_factura (str DD/MM/YYYY), monto_total (float), cuit_cliente (str solo números sin guiones), nombre_proveedor (str). Usa null para los campos que no puedas extraer. Sin texto adicional fuera del JSON."


def _encontrar_adjunto_pdf(parts: list) -> Optional[dict]:
    for p in parts:
        if p.get("filename", "").lower().endswith(".pdf") and p.get("body", {}).get("attachmentId"):
            return p
        found = _encontrar_adjunto_pdf(p.get("parts", []))
        if found:
            return found
    return None


def buscar_facturas_nuevas(db: Session) -> list[dict]:
    """
    Lee la bandeja de Gmail filtrando ÚNICAMENTE emails cuyos remitentes
    coincidan exactamente con el email de algún Proveedor registrado en DB.
    Para cada PDF adjunto: descarga, extrae datos con Claude y crea Factura.
    Nunca lanza excepción si un PDF falla — loguea el error y continúa.

    Returns: lista de dicts {factura_id, proveedor, archivo} por cada factura detectada.
    """
    credentials = google_auth_service.get_credentials(db)
    service = build("gmail", "v1", credentials=credentials)

    proveedores = proveedor_repo.find_all(db)
    emails_prov = {p.email.lower(): p for p in proveedores if p.email}
    if not emails_prov:
        return []

    query = f"({' OR '.join(f'from:{e}' for e in emails_prov)}) has:attachment filename:pdf"
    msgs = service.users().messages().list(userId="me", q=query).execute().get("messages", [])

    detectadas = []
    for msg in msgs:
        try:
            info = _procesar_mensaje(service, msg["id"], emails_prov, db)
            if info:
                detectadas.append(info)
        except Exception as exc:
            logger.error("Error al procesar mensaje Gmail", extra={"message_id": msg["id"], "error": str(exc)})
    return detectadas


def _procesar_mensaje(
    service, message_id: str, emails_prov: dict, db: Session
) -> Optional[dict]:
    if factura_repo.find_by_gmail_message_id(db, message_id):
        return None

    msg = service.users().messages().get(userId="me", id=message_id, format="full").execute()
    from_header = next(
        (h["value"] for h in msg["payload"]["headers"] if h["name"].lower() == "from"), ""
    )
    email_rem = from_header.split("<")[-1].rstrip(">").lower().strip()
    proveedor = emails_prov.get(email_rem)
    if not proveedor:
        return None

    adjunto = _encontrar_adjunto_pdf(msg.get("payload", {}).get("parts", []))
    if not adjunto:
        return None

    data = service.users().messages().attachments().get(
        userId="me", messageId=message_id, id=adjunto["body"]["attachmentId"]
    ).execute()
    pdf_bytes = base64.urlsafe_b64decode(data["data"])
    filename = adjunto["filename"]
    stored_name = f"{message_id}_{filename}"
    os.makedirs(_UPLOADS, exist_ok=True)
    pdf_path = os.path.join(_UPLOADS, stored_name)
    with open(pdf_path, "wb") as f:
        f.write(pdf_bytes)

    datos = extraer_datos_factura(pdf_path)
    cuit = datos.get("cuit_cliente")
    cliente = cliente_repo.find_by_cuit(db, cuit) if cuit else None

    factura = factura_repo.create(db, {
        "nombre_archivo": stored_name,
        "proveedor_id": proveedor.id,
        "gmail_message_id": message_id,
        "numero_factura": datos.get("numero_factura"),
        "monto_total": datos.get("monto_total"),
        "estado": "pendiente_confirmacion",
    })
    if cliente:
        factura_repo.create_cliente_asociado(db, factura.id, cliente.id)

    logger.info("Factura detectada", extra={"proveedor": proveedor.nombre, "message_id": message_id})
    return {"factura_id": factura.id, "proveedor": proveedor.nombre, "archivo": stored_name}


def extraer_datos_factura(pdf_path: str) -> dict:
    """
    Convierte la primera página del PDF a imagen JPEG y la envía a Claude
    (claude-sonnet-4-20250514) para extraer datos de la factura.
    System prompt separado del user input (SEGURIDAD-PENTEST.md 6.1).

    Returns: dict con numero_factura, fecha_factura, monto_total, cuit_cliente,
             nombre_proveedor. Campos no extraíbles como null.
    """
    _vacio = {
        "numero_factura": None, "fecha_factura": None, "monto_total": None,
        "cuit_cliente": None, "nombre_proveedor": None,
    }
    try:
        paginas = convert_from_path(pdf_path, first_page=1, last_page=1, fmt="jpeg")
        if not paginas:
            return _vacio
        buf = BytesIO()
        paginas[0].save(buf, format="JPEG")
        img_b64 = base64.b64encode(buf.getvalue()).decode()

        from config.settings import settings  # lazy — evita falla en startup sin ANTHROPIC_API_KEY
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        resp = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            system=_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": [{"type": "image", "source": {
                "type": "base64", "media_type": "image/jpeg", "data": img_b64,
            }}]}],
        )
        return json.loads(resp.content[0].text)
    except Exception:
        logger.error("Error extrayendo datos de PDF", extra={"pdf_path": pdf_path})
        return _vacio
