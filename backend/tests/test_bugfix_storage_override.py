"""
Tests end-to-end de los dos bugs de producción:

BUG 1 — La clave de Storage se separa del nombre visible (con '%'):
  el objeto se sube con una storage_key interna limpia (facturas/{id}.pdf) y el
  nombre original con '%' se conserva solo como nombre visible (UI + adjunto).

BUG 2 — El override manual de asunto/cuerpo tiene prioridad sobre la plantilla.

Se mockea SOLO la capa externa (Supabase Storage y la API de Gmail). Toda nuestra
lógica intermedia (build_storage_key, subir_pdf, descargar_pdf, obtener_pdf_path,
gmail_sender_service.enviar_email, envio_service.enviar, factura_service.subir_manual)
se ejercita de verdad.
"""
import base64
import email
import os
from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest

from models import Plantilla, _uuid
from repositories import factura_repo
from schemas.envio import ClienteEnvioItem
from services import envio_service, factura_service, storage_service
from utils.errors import AppError

NOMBRE_VISIBLE = "FA_01_00000239_Infoexperto_100%_MDP.pdf"


@pytest.fixture(autouse=True)
def _ensure_tmp():
    # En producción (Linux) /tmp existe; en Windows lo garantizamos para el test.
    os.makedirs("/tmp", exist_ok=True)


@pytest.fixture
def plantilla_buendia(db_session):
    """Plantilla de envío cuyo cuerpo dice 'Buen día' (lo que NO debe salir si hay override)."""
    p = Plantilla(
        nombre="Envio Factura",
        tipo="envio",
        asunto="ASUNTO PLANTILLA {{numero_factura}}",
        cuerpo="Buen día {{nombre_destinatario}}, adjunto la factura {{numero_factura}}.",
    )
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)
    return p


@pytest.fixture
def factura_pct(db_session, proveedor_base, cliente_base):
    """Factura confirmada con nombre_archivo con '%' y storage_key interna limpia."""
    fid = _uuid()
    f = factura_repo.create(db_session, {
        "id": fid,
        "nombre_archivo": NOMBRE_VISIBLE,
        "storage_key": storage_service.build_storage_key(fid),
        "numero_factura": "0001-00000239",
        "fecha_factura": datetime(2025, 3, 1),
        "monto_total": 10000.0,
        "estado": "confirmada",
        "proveedor_id": proveedor_base.id,
    })
    factura_repo.create_cliente_asociado(db_session, f.id, cliente_base.id)
    return f


def _fake_storage_client():
    """Cliente Supabase falso: registra .upload() y devuelve URLs/bytes reales (no MagicMock)."""
    bucket = MagicMock()
    bucket.get_public_url.side_effect = lambda key: f"https://fake.supabase/{key}"
    bucket.download.return_value = b"%PDF-1.4 contenido-de-prueba"
    client = MagicMock()
    client.storage.from_.return_value = bucket
    return client, bucket


def _run_enviar_capturando_mime(db, factura, cliente, plantilla, *, asunto_override, cuerpo_override):
    """
    Ejecuta envio_service.enviar() de punta a punta mockeando solo Gmail y Storage.
    Devuelve el MIME que gmail_sender_service construyó y habría enviado.
    """
    clientes_input = [ClienteEnvioItem(cliente_id=cliente.id, monto=None)]

    send = MagicMock()
    send.execute.return_value = {"id": "gmail_msg_test"}
    messages = MagicMock()
    messages.send.return_value = send
    users = MagicMock()
    users.messages.return_value = messages
    fake_gmail = MagicMock()
    fake_gmail.users.return_value = users

    with (
        patch("services.gmail_sender_service.build", return_value=fake_gmail),
        patch("services.gmail_sender_service.google_auth_service.get_credentials", return_value=MagicMock()),
        patch("services.storage_service.descargar_pdf", return_value=b"%PDF-1.4 adjunto"),
        patch("services.sheets_writer_service.registrar_envio", return_value=None),
    ):
        envio_service.enviar(
            factura_id=factura.id,
            clientes_input=clientes_input,
            plantilla_id=plantilla.id,
            asunto_override=asunto_override,
            cuerpo_override=cuerpo_override,
            cc=[],
            db=db,
        )

    raw = messages.send.call_args.kwargs["body"]["raw"]
    return email.message_from_bytes(base64.urlsafe_b64decode(raw))


def _extraer_cuerpo_y_adjunto(mime):
    cuerpo = None
    adjunto_filename = None
    for part in mime.walk():
        disp = part.get("Content-Disposition", "") or ""
        if "attachment" in disp:
            adjunto_filename = part.get_filename()
        elif part.get_content_maintype() == "text":
            cuerpo = part.get_payload(decode=True).decode()
    return cuerpo, adjunto_filename


# ─── BUG 1 ────────────────────────────────────────────────────────────────────

def test_bug1_subida_usa_storage_key_limpia_y_conserva_nombre_visible(db_session):
    """Puntos 1 y 2: se sube con key limpia (sin '%') y en DB storage_key=limpia, nombre_archivo=con '%'."""
    client, bucket = _fake_storage_client()
    datos = {"numero_factura": "0001-00000239", "fecha_factura": "01/03/2025",
             "monto_total": 10000.0, "nombre_proveedor": "Infoexperto"}

    with (
        patch("services.storage_service.get_supabase_client", return_value=client),
        patch("services.gmail_reader_service.extraer_datos_factura", return_value=datos),
    ):
        resultado = factura_service.subir_manual(db_session, b"%PDF-1.4 fake", NOMBRE_VISIBLE)

    # (1) La key con la que se subió a Storage es la limpia, no el nombre con '%'.
    key_subida = bucket.upload.call_args.args[0]
    assert "%" not in key_subida
    assert key_subida.startswith("facturas/") and key_subida.endswith(".pdf")

    # (2) En DB: storage_key = key limpia, nombre_archivo = nombre visible con '%' intacto.
    factura = factura_repo.find_by_id(db_session, resultado["factura_id"])
    assert factura.storage_key == key_subida
    assert factura.nombre_archivo == NOMBRE_VISIBLE
    assert "%" in factura.nombre_archivo


def test_bug1_descarga_encodea_key_y_nunca_pasa_porciento_crudo(db_session):
    """Punto 3: al descargar, al SDK se le pasa la key limpia o el quote() — nunca un '%' crudo inválido."""
    client, bucket = _fake_storage_client()
    with patch("services.storage_service.get_supabase_client", return_value=client):
        # Key limpia (caso normal): pasa igual, sin '%'.
        storage_service.descargar_pdf("facturas/abc-123.pdf")
        arg_limpia = bucket.download.call_args.args[0]
        assert arg_limpia == "facturas/abc-123.pdf"
        assert "%" not in arg_limpia

        # Key legacy con '%' (registros viejos): se encodea, sin dejar '%' crudo inválido.
        storage_service.descargar_pdf(NOMBRE_VISIBLE)
        arg_legacy = bucket.download.call_args.args[0]
        assert "%25" in arg_legacy          # el '%' quedó percent-encodeado
        assert "%_" not in arg_legacy        # no quedó la secuencia inválida '%_' que rompía


def test_bug1_adjunto_del_correo_usa_nombre_visible_con_porciento(db_session, factura_pct, cliente_base, plantilla_buendia):
    """Punto 4 (clave del bug): el filename del adjunto sale de nombre_archivo (con '%'), no de storage_key."""
    mime = _run_enviar_capturando_mime(
        db_session, factura_pct, cliente_base, plantilla_buendia,
        asunto_override=None, cuerpo_override=None,
    )
    _, adjunto_filename = _extraer_cuerpo_y_adjunto(mime)
    assert adjunto_filename == NOMBRE_VISIBLE
    # Y jamás el nombre interno de Storage.
    assert adjunto_filename != factura_pct.storage_key
    assert not adjunto_filename.startswith("facturas/")


def test_bug1_subida_fallida_no_deja_factura_huerfana(db_session):
    """Punto 5: si Storage falla al subir, se propaga AppError y NO queda registro huérfano."""
    client, bucket = _fake_storage_client()
    bucket.upload.side_effect = Exception("500 Storage caído")
    datos = {"numero_factura": "X", "fecha_factura": None, "monto_total": None, "nombre_proveedor": None}

    with (
        patch("services.storage_service.get_supabase_client", return_value=client),
        patch("services.gmail_reader_service.extraer_datos_factura", return_value=datos),
        pytest.raises(AppError) as exc_info,
    ):
        factura_service.subir_manual(db_session, b"%PDF-1.4 fake", NOMBRE_VISIBLE)

    assert exc_info.value.code == "STORAGE_UPLOAD_FAILED"
    assert factura_repo.find_all(db_session) == []  # sin facturas fantasma


# ─── BUG 2 ────────────────────────────────────────────────────────────────────

def test_bug2_cuerpo_override_se_respeta(db_session, factura_confirmada, cliente_base, plantilla_buendia):
    """Punto 6: con cuerpo_override el correo usa ese texto, no la plantilla ('Buen día')."""
    mime = _run_enviar_capturando_mime(
        db_session, factura_confirmada, cliente_base, plantilla_buendia,
        asunto_override=None, cuerpo_override="Buenas tardes, le enviamos su factura.",
    )
    cuerpo, _ = _extraer_cuerpo_y_adjunto(mime)
    assert "Buenas tardes" in cuerpo
    assert "Buen día" not in cuerpo


def test_bug2_cuerpo_override_none_cae_a_plantilla(db_session, factura_confirmada, cliente_base, plantilla_buendia):
    """Punto 7: sin override, el fallback a la plantilla renderizada sigue funcionando."""
    mime = _run_enviar_capturando_mime(
        db_session, factura_confirmada, cliente_base, plantilla_buendia,
        asunto_override=None, cuerpo_override=None,
    )
    cuerpo, _ = _extraer_cuerpo_y_adjunto(mime)
    assert "Buen día" in cuerpo
    assert "Buenas tardes" not in cuerpo


def test_bug2_asunto_override_se_respeta(db_session, factura_confirmada, cliente_base, plantilla_buendia):
    """Punto 8: con asunto_override el correo usa ese asunto, no el de la plantilla."""
    mime = _run_enviar_capturando_mime(
        db_session, factura_confirmada, cliente_base, plantilla_buendia,
        asunto_override="ASUNTO MANUAL EDITADO", cuerpo_override=None,
    )
    assert mime["Subject"] == "ASUNTO MANUAL EDITADO"


def test_bug2_asunto_override_none_cae_a_plantilla(db_session, factura_confirmada, cliente_base, plantilla_buendia):
    """Punto 8 (fallback): sin override, el asunto sale de la plantilla renderizada."""
    mime = _run_enviar_capturando_mime(
        db_session, factura_confirmada, cliente_base, plantilla_buendia,
        asunto_override=None, cuerpo_override=None,
    )
    assert mime["Subject"] == "ASUNTO PLANTILLA 0001-00000001"
