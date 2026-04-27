from datetime import datetime, timezone
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
    Campos: Fecha, Hora, Tipo=pedido, Proyecto (cliente.nombre), CUIT (cliente.cuit),
    Mes/Año, Proveedor (proveedor.nombre), Consumos API, Estado=pedido_enviado.

    Args:
        pedido: Instancia de Pedido con proveedor y mes/anio cargados.
        items: Lista de PedidoItem con relación a cliente cargada.
        db: Sesión de base de datos.

    Returns:
        Lista de números de fila escritos en el Sheet.

    Raises:
        AppError SHEET_NOT_FOUND 404 si no hay sheet_id configurado.
        AppError SHEET_WRITE_FAILED 500 si falla la escritura.
    """
    config = google_config_repo.find(db)
    if not config or not config.sheet_id:
        raise AppError("Sheet no configurado", "SHEET_NOT_FOUND", 404)
    credentials = google_auth_service.get_credentials(db)
    service = build("sheets", "v4", credentials=credentials)

    ahora = datetime.now(timezone.utc)
    filas = []
    for item in items:
        cli = item.cliente
        filas.append([
            ahora.strftime("%d/%m/%Y"), ahora.strftime("%H:%M"), "pedido",
            cli.nombre if cli else "", cli.cuit or "" if cli else "",
            f"{pedido.mes}/{pedido.anio}",
            pedido.proveedor.nombre if pedido.proveedor else "",
            item.consultas_api or "", "", "", "", "pedido_enviado", "",
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
    Si sheets_row existe, actualiza esa fila con Link Drive, Monto y Estado=enviado.
    Si no hay sheets_row previa, agrega una fila nueva con todos los campos.

    Args:
        factura: Instancia de Factura con proveedor cargado.
        cliente: Instancia de Cliente destinatario.
        drive_url: URL del archivo en Drive.
        sheets_row: Número de fila preexistente a actualizar, o None para agregar nueva.
        db: Sesión de base de datos.

    Raises:
        AppError SHEET_NOT_FOUND 404 si no hay sheet_id configurado.
        AppError SHEET_WRITE_FAILED 500 si falla la escritura.
    """
    config = google_config_repo.find(db)
    if not config or not config.sheet_id:
        raise AppError("Sheet no configurado", "SHEET_NOT_FOUND", 404)
    credentials = google_auth_service.get_credentials(db)
    service = build("sheets", "v4", credentials=credentials)

    try:
        if sheets_row:
            service.spreadsheets().values().update(
                spreadsheetId=config.sheet_id,
                range=f"J{sheets_row}:L{sheets_row}",
                valueInputOption="RAW",
                body={"values": [[drive_url, factura.monto_total or "", "enviado"]]},
            ).execute()
        else:
            ahora = datetime.now(timezone.utc)
            cli = cliente
            fila = [
                ahora.strftime("%d/%m/%Y"), ahora.strftime("%H:%M"), "envio",
                cli.nombre if cli else "", cli.cuit or "" if cli else "",
                "", factura.proveedor.nombre if factura.proveedor else "",
                "", factura.numero_factura or "", drive_url,
                factura.monto_total or "", "enviado",
                cli.email or "" if cli else "",
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
