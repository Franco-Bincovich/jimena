from typing import Optional

from googleapiclient.discovery import build
from sqlalchemy.orm import Session

from repositories import google_config_repo
from services import google_auth_service
from utils.errors import AppError
from utils.logger import logger


def registrar_pedido(pedido, items: list, db: Session) -> list[int]:
    """
    Agrega una fila por cada PedidoItem en el Sheet con columnas A-J.

    A: cliente.nombre, B: cliente.cuit, C: MM/YYYY, D: proveedor.nombre,
    E: consultas_api, F-H: vacío, I: vacío (Monto), J: proveedor.email.

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
            item.consultas_api or "",
            "",
            "",
            "",
            "",
            proveedor_email,
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
    Si sheets_row existe, actualiza F (numero_factura) e I (monto_total) en esa fila.
    Si no hay sheets_row, agrega una fila nueva con columnas A-J.

    Args:
        factura: Instancia de Factura con proveedor y fecha_factura cargados.
        cliente: Instancia de Cliente destinatario.
        drive_url: URL del archivo en Drive (no se escribe en el Sheet).
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
            service.spreadsheets().values().batchUpdate(
                spreadsheetId=config.sheet_id,
                body={
                    "valueInputOption": "RAW",
                    "data": [
                        {
                            "range": f"F{sheets_row}",
                            "values": [[factura.numero_factura or ""]],
                        },
                        {
                            "range": f"I{sheets_row}",
                            "values": [[factura.monto_total or ""]],
                        },
                    ],
                },
            ).execute()
        else:
            cli = cliente
            fecha = factura.fecha_factura
            mes_anio = fecha.strftime("%m/%Y") if hasattr(fecha, "strftime") else ""
            proveedor_nombre = factura.proveedor.nombre if factura.proveedor else ""
            fila = [
                cli.nombre if cli else "",
                cli.cuit or "" if cli else "",
                mes_anio,
                proveedor_nombre,
                "",
                factura.numero_factura or "",
                "",
                "",
                factura.monto_total or "",
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
