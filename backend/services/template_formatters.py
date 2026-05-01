MESES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]


def formatear_fecha(d) -> str:
    return d.strftime("%d/%m/%Y")


def formatear_fecha_iso(s: str) -> str:
    """Convierte string YYYY-MM-DD a DD/MM/YYYY."""
    if not s:
        return ""
    try:
        y, m, d = s.split("-")
        return f"{d}/{m}/{y}"
    except (ValueError, AttributeError):
        return s


def formatear_monto(monto: float) -> str:
    formatted = f"{monto:,.2f}"
    return "$ " + formatted.replace(",", "X").replace(".", ",").replace("X", ".")


def reemplazar(texto: str, variables: dict) -> str:
    for clave, valor in variables.items():
        texto = texto.replace("{{" + clave + "}}", str(valor))
    return texto
