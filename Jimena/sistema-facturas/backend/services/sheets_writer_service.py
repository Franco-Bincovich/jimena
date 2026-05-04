from typing import Optional

from googleapiclient.discovery import build
from sqlalchemy.orm import Session

from repositories import google_config_repo
from services import google_auth_service
from utils.errors import AppError
from utils.logger import logger


def registrar_pedido(pedido, items: list, db: Session) -> list[int]:
    """
    Agrega una fila por cada PedidoItem en el Sheet.

    Columnas (A-J):
        A: Proyecto, B: CUIT, C: Mes/Año (MM/YYYY), D: Proveedor,
        E: Consumos, F: Factura (vacío), G: Pago (vacío), H: Retencion (vacío),
        I: Monto (vacío), J: Mail (email del proveedor).
    """
    config = google_config_repo.find(db)
    if not config or not config.sheet_id:
        raise AppError("Sheet no configurado", "SHEET_NOT_FOUND", 404)
    credentials = google_auth_service.get_credentials(db)
    service = build("sheets", "v4", credentials=credentials)

    mes_anio = f"{pedido.mes:02d}/{pedido.anio}"
    proveedor_nombre = pedido.proveedor.nombre if pedido.proveedor else ""
    proveedor_email = pedido.proveedor.email if pedido.proveedor else ""

    filas = []
    for item in items:
        cli = item.cliente
        filas.append([
            cli.nombre if cli else "",
            cli.cuit or "" if cli else "",
            mes_anio,
            proveedor_nombre,
            item.consultas_api if item.consultas_api is not None else "",
            "",  # Factura
            "",  # Pago
            "",  # Retencion
            "",  # Monto
            proveedor_email,  # Mail
        ])

    try:
        existentes = service.spreadsheets().values().get(
            spreadsheetId=config.sheet_id, range="A:A"
        ).execute()
        next_row = len(existentes.get("values", [])) + 1
        service.spreadsheets().values().update(
            spreadsheetId=config.sheet_id,
            range=f"A{next_row}",
            valueInputOption="RAW",
            body={"values": filas},
        ).execute()
        return list(range(next_row, next_row + len(filas)))
    except Exception as exc:
        logger.error("Error escribiendo pedido en Sheet", extra={"error": str(exc)})
        raise AppError("Error al escribir en el Sheet", "SHEET_WRITE_FAILED", 500)


def registrar_envio(
    factura, cliente, drive_url: str, sheets_row: Optional[int], db: Session
) -> None:
    """
    Si sheets_row existe, actualiza solo F (Factura) e I (Monto) de esa fila.
    Si no hay sheets_row, agrega una fila nueva con la estructura de 10 columnas (A-J).

    Columnas (A-J):
        A: Proyecto, B: CUIT, C: Mes/Año (MM/YYYY), D: Proveedor,
        E: Consumos (vacío), F: Factura, G: Pago (vacío), H: Retencion (vacío),
        I: Monto, J: Mail (email del cliente).
    """
    config = google_config_repo.find(db)
    if not config or not config.sheet_id:
        raise AppError("Sheet no configurado", "SHEET_NOT_FOUND", 404)
    credentials = google_auth_service.get_credentials(db)
    service = build("sheets", "v4", credentials=credentials)

    try:
        if sheets_row:
            service.spreadsheets().values().batchUpdate(
                spreadsheetId=config.sheet_id,
                body={
                    "valueInputOption": "RAW",
                    "data": [
                        {"range": f"F{sheets_row}", "values": [[factura.numero_factura or ""]]},
                        {"range": f"I{sheets_row}", "values": [[factura.monto_total or ""]]},
                    ],
                },
            ).execute()
        else:
            cli = cliente
            mes_anio = ""
            if factura.fecha_factura:
                fd = factura.fecha_factura
                mes_anio = f"{fd.month:02d}/{fd.year}"
            fila = [
                cli.nombre if cli else "",
                cli.cuit or "" if cli else "",
                mes_anio,
                factura.proveedor.nombre if factura.proveedor else "",
                "",  # Consumos
                factura.numero_factura or "",
                "",  # Pago
                "",  # Retencion
                factura.monto_total or "",
                cli.email or "" if cli else "",  # Mail
            ]
            service.spreadsheets().values().append(
                spreadsheetId=config.sheet_id,
                range="A1",
                valueInputOption="RAW",
                insertDataOption="INSERT_ROWS",
                body={"values": [fila]},
            ).execute()
    except Exception as exc:
        logger.error("Error registrando envío en Sheet", extra={"error": str(exc)})
        raise AppError("Error al escribir en el Sheet", "SHEET_WRITE_FAILED", 500)
