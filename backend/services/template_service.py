from services.template_formatters import MESES, formatear_fecha, formatear_fecha_iso, formatear_monto, reemplazar


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
      {{clientes}}          → bloque generado con un item por cada cliente

    Returns:
        {"asunto": str, "cuerpo": str} con todas las variables resueltas.
    """
    bloque_clientes = "\n\n".join(
        f"Cliente: {item.cliente.nombre}\n"
        f"Al CUIT: {item.cliente.cuit or '-'}\n"
        f"Cantidad de consultas: {item.consultas_api if item.consultas_api is not None else '-'}"
        for item in items
    )
    variables = {
        "proveedor": proveedor.nombre,
        "mes": MESES[periodo["mes"] - 1],
        "año": str(periodo["anio"]),
        "fecha_desde": formatear_fecha(periodo["fecha_desde"]),
        "fecha_hasta": formatear_fecha(periodo["fecha_hasta"]),
        "empresa_remitente": config.empresa_nombre if config and config.empresa_nombre else "",
        "clientes": bloque_clientes,
    }
    return {
        "asunto": reemplazar(plantilla.asunto, variables),
        "cuerpo": reemplazar(plantilla.cuerpo, variables),
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
        todos_clientes_con_monto: Lista de ClienteConMonto (cliente + monto opcional).
        config: Instancia de GoogleConfig con empresa_nombre (puede ser None).
        datos_manuales: DatosManuales opcionales para campos sin factura.

    Variables disponibles:
      {{nombre_destinatario}}, {{cliente}}, {{empresa_remitente}}, {{proveedor}},
      {{mes}}, {{año}}, {{numero_factura}}, {{fecha_factura}}, {{fecha_desde}},
      {{fecha_hasta}}, {{monto_total}}, {{clientes_con_montos}}

    Returns:
        {"asunto": str, "cuerpo": str} con todas las variables resueltas.
    """
    if len(todos_clientes_con_monto) > 1:
        lineas = []
        for item in todos_clientes_con_monto:
            monto_str = formatear_monto(item.monto) if item.monto is not None else "—"
            lineas.append(f"El monto a facturar del cliente {item.cliente.nombre} es {monto_str}")
        bloque_clientes_con_montos = "\n".join(lineas)
    else:
        bloque_clientes_con_montos = ""

    dm = datos_manuales
    fecha = factura.fecha_factura
    variables = {
        "nombre_destinatario": cliente.nombre,
        "cliente": cliente.nombre,
        "empresa_remitente": config.empresa_nombre if config and config.empresa_nombre else "",
        "proveedor": (factura.proveedor.nombre if factura.proveedor else "") or (dm.proveedor or "" if dm else ""),
        "mes": (MESES[fecha.month - 1] if fecha else "") or (dm.mes or "" if dm else ""),
        "año": (str(fecha.year) if fecha else "") or (dm.anio or "" if dm else ""),
        "numero_factura": (factura.numero_factura or "") or (dm.numero_factura or "" if dm else ""),
        "fecha_factura": formatear_fecha(fecha) if fecha else "",
        "fecha_desde": (formatear_fecha(factura.fecha_desde) if factura.fecha_desde else "") or (formatear_fecha_iso(dm.fecha_desde) if dm and dm.fecha_desde else ""),
        "fecha_hasta": (formatear_fecha(factura.fecha_hasta) if factura.fecha_hasta else "") or (formatear_fecha_iso(dm.fecha_hasta) if dm and dm.fecha_hasta else ""),
        "monto_total": (formatear_monto(factura.monto_total) if factura.monto_total else "") or (formatear_monto(dm.monto_total) if dm and dm.monto_total else ""),
        "clientes_con_montos": bloque_clientes_con_montos,
    }
    return {
        "asunto": reemplazar(plantilla.asunto, variables),
        "cuerpo": reemplazar(plantilla.cuerpo, variables),
    }
