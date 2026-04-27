from typing import Optional

_MESES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]


def _formatear_fecha(d) -> str:
    return d.strftime("%d/%m/%Y")


def _formatear_fecha_iso(s: str) -> str:
    """Convierte string YYYY-MM-DD a DD/MM/YYYY."""
    if not s:
        return ""
    try:
        y, m, d = s.split("-")
        return f"{d}/{m}/{y}"
    except (ValueError, AttributeError):
        return s


def _formatear_monto(monto: float) -> str:
    formatted = f"{monto:,.2f}"
    return "$ " + formatted.replace(",", "X").replace(".", ",").replace("X", ".")


def _reemplazar(texto: str, variables: dict) -> str:
    for clave, valor in variables.items():
        texto = texto.replace("{{" + clave + "}}", str(valor))
    return texto


def resolver_variables_pedido(
    plantilla,
    proveedor,
    items: list,
    periodo: dict,
    config=None,
) -> dict:
    """
    Resuelve las variables de una plantilla de tipo 'pedido'.

    Args:
        plantilla: Instancia de Plantilla con asunto y cuerpo.
        proveedor: Instancia de Proveedor con nombre.
        items: Lista de objetos con atributos .cliente (nombre, cuit) y .consultas_api.
        periodo: Dict con claves mes (int 1-12), anio (int), fecha_desde (date),
                 fecha_hasta (date).
        config: Instancia de GoogleConfig con empresa_nombre (puede ser None).

    Variables disponibles:
      {{proveedor}}         → proveedor.nombre
      {{mes}}               → nombre del mes en español (ej: "marzo")
      {{año}}               → año como string (ej: "2026")
      {{fecha_desde}}       → periodo["fecha_desde"] formateado DD/MM/YYYY
      {{fecha_hasta}}       → periodo["fecha_hasta"] formateado DD/MM/YYYY
      {{empresa_remitente}} → config.empresa_nombre
      {{clientes}}          → bloque generado con un item por cada cliente:
                              "Cliente: {nombre}
                               Al CUIT: {cuit}
                               Cantidad de consultas: {consultas_api or '-'}"
                              Los items van separados por línea en blanco.

    Returns:
        {"asunto": str, "cuerpo": str} con todas las variables resueltas.
        Las variables no encontradas en el contexto se dejan como están.
    """
    bloque_clientes = "\n\n".join(
        f"Cliente: {item.cliente.nombre}\n"
        f"Al CUIT: {item.cliente.cuit or '-'}\n"
        f"Cantidad de consultas: {item.consultas_api if item.consultas_api is not None else '-'}"
        for item in items
    )
    variables = {
        "proveedor": proveedor.nombre,
        "mes": _MESES[periodo["mes"] - 1],
        "año": str(periodo["anio"]),
        "fecha_desde": _formatear_fecha(periodo["fecha_desde"]),
        "fecha_hasta": _formatear_fecha(periodo["fecha_hasta"]),
        "empresa_remitente": config.empresa_nombre if config and config.empresa_nombre else "",
        "clientes": bloque_clientes,
    }
    return {
        "asunto": _reemplazar(plantilla.asunto, variables),
        "cuerpo": _reemplazar(plantilla.cuerpo, variables),
    }


def resolver_variables_envio(
    plantilla,
    cliente,
    factura,
    todos_clientes_con_monto: list,
    config=None,
    datos_manuales=None,
) -> dict:
    """
    Resuelve las variables de una plantilla de tipo 'envio'.

    Args:
        plantilla: Instancia de Plantilla con asunto y cuerpo.
        cliente: Instancia de Cliente destinatario principal.
        factura: Instancia de Factura con fecha_factura, numero_factura y monto_total.
        todos_clientes_con_monto: Lista de _ClienteConMonto (cliente + monto opcional).
                                  Incluye al cliente principal como primer elemento.
        config: Instancia de GoogleConfig con empresa_nombre (puede ser None).

    Variables disponibles:
      {{nombre_destinatario}}   → cliente.nombre
      {{cliente}}               → cliente.nombre
      {{empresa_remitente}}     → config.empresa_nombre
      {{proveedor}}             → factura.proveedor.nombre
      {{mes}}                   → mes de factura.fecha_factura en español
      {{año}}                   → año de factura.fecha_factura
      {{numero_factura}}        → factura.numero_factura
      {{fecha_factura}}         → factura.fecha_factura formateado DD/MM/YYYY
      {{fecha_desde}}           → factura.fecha_desde formateado DD/MM/YYYY o ""
      {{fecha_hasta}}           → factura.fecha_hasta formateado DD/MM/YYYY o ""
      {{monto_total}}           → factura.monto_total formateado como moneda
      {{clientes_con_montos}}   → si hay más de un cliente: una línea por cliente con
                                  "El monto a facturar del cliente {nombre} es {monto}".
                                  Si hay un solo cliente: string vacío.

    Returns:
        {"asunto": str, "cuerpo": str} con todas las variables resueltas.
        Las variables no encontradas en el contexto se dejan como están.
    """
    if len(todos_clientes_con_monto) > 1:
        lineas = []
        for item in todos_clientes_con_monto:
            monto_str = _formatear_monto(item.monto) if item.monto is not None else "—"
            lineas.append(f"El monto a facturar del cliente {item.cliente.nombre} es {monto_str}")
        bloque_clientes_con_montos = "\n".join(lineas)
    else:
        bloque_clientes_con_montos = ""

    dm = datos_manuales  # alias corto
    fecha = factura.fecha_factura
    variables = {
        "nombre_destinatario": cliente.nombre,
        "cliente": cliente.nombre,
        "empresa_remitente": config.empresa_nombre if config and config.empresa_nombre else "",
        "proveedor": (factura.proveedor.nombre if factura.proveedor else "") or (dm.proveedor or "" if dm else ""),
        "mes": (_MESES[fecha.month - 1] if fecha else "") or (dm.mes or "" if dm else ""),
        "año": (str(fecha.year) if fecha else "") or (dm.anio or "" if dm else ""),
        "numero_factura": (factura.numero_factura or "") or (dm.numero_factura or "" if dm else ""),
        "fecha_factura": _formatear_fecha(fecha) if fecha else "",
        "fecha_desde": (_formatear_fecha(factura.fecha_desde) if factura.fecha_desde else "") or (_formatear_fecha_iso(dm.fecha_desde) if dm and dm.fecha_desde else ""),
        "fecha_hasta": (_formatear_fecha(factura.fecha_hasta) if factura.fecha_hasta else "") or (_formatear_fecha_iso(dm.fecha_hasta) if dm and dm.fecha_hasta else ""),
        "monto_total": (_formatear_monto(factura.monto_total) if factura.monto_total else "") or (_formatear_monto(dm.monto_total) if dm and dm.monto_total else ""),
        "clientes_con_montos": bloque_clientes_con_montos,
    }
    return {
        "asunto": _reemplazar(plantilla.asunto, variables),
        "cuerpo": _reemplazar(plantilla.cuerpo, variables),
    }
