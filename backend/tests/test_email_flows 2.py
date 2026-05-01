from unittest.mock import MagicMock, patch

import pytest


# ─── PEDIDOS (4) ────────────────────────────────────────────────────────────

async def test_preview_pedido(client, proveedor_base, cliente_base, plantilla_pedido):
    payload = {
        "proveedor_id": proveedor_base.id,
        "plantilla_id": plantilla_pedido.id,
        "mes": 3,
        "anio": 2025,
        "fecha_desde": "2025-03-01",
        "fecha_hasta": "2025-03-31",
        "items": [{"cliente_id": cliente_base.id, "consultas_api": 100}],
    }
    resp = await client.post("/api/pedidos/preview", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "asunto" in data
    assert "marzo" in data["asunto"]
    assert data["proveedor"]["nombre"] == "Proveedor Test"
    assert data["clientes"][0]["nombre"] == "Cliente Test"


async def test_preview_pedido_proveedor_not_found(client, plantilla_pedido, cliente_base):
    payload = {
        "proveedor_id": "00000000-0000-0000-0000-000000000000",
        "plantilla_id": plantilla_pedido.id,
        "mes": 3,
        "anio": 2025,
        "fecha_desde": "2025-03-01",
        "fecha_hasta": "2025-03-31",
        "items": [{"cliente_id": cliente_base.id}],
    }
    resp = await client.post("/api/pedidos/preview", json=payload)
    assert resp.status_code == 404
    assert resp.json()["code"] == "PROVEEDOR_NOT_FOUND"


async def test_enviar_pedido(client, proveedor_base, cliente_base, plantilla_pedido):
    payload = {
        "proveedor_id": proveedor_base.id,
        "plantilla_id": plantilla_pedido.id,
        "mes": 3,
        "anio": 2025,
        "fecha_desde": "2025-03-01",
        "fecha_hasta": "2025-03-31",
        "items": [{"cliente_id": cliente_base.id, "consultas_api": 10}],
    }
    with (
        patch("routers.pedidos.get_credentials", return_value=MagicMock()),
        patch("services.gmail_sender_service.enviar_email", return_value="msg_id_123") as mock_gmail,
        patch("services.sheets_writer_service.registrar_pedido", return_value=[2]),
    ):
        resp = await client.post("/api/pedidos/enviar", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["gmail_message_id"] == "msg_id_123"
    assert "pedido_id" in data
    mock_gmail.assert_called_once()


async def test_enviar_pedido_google_not_connected(client, proveedor_base, cliente_base, plantilla_pedido):
    payload = {
        "proveedor_id": proveedor_base.id,
        "plantilla_id": plantilla_pedido.id,
        "mes": 3,
        "anio": 2025,
        "fecha_desde": "2025-03-01",
        "fecha_hasta": "2025-03-31",
        "items": [{"cliente_id": cliente_base.id}],
    }
    resp = await client.post("/api/pedidos/enviar", json=payload)
    assert resp.status_code == 403
    assert resp.json()["code"] == "GOOGLE_NOT_CONNECTED"


# ─── ENVÍOS (5) ─────────────────────────────────────────────────────────────

async def test_preview_envio(client, factura_confirmada, cliente_base, plantilla_envio):
    payload = {
        "factura_id": factura_confirmada.id,
        "cliente_id": cliente_base.id,
        "plantilla_id": plantilla_envio.id,
    }
    resp = await client.post("/api/envios/preview", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "asunto" in data
    assert "0001-00000001" in data["asunto"]
    assert data["cliente"]["nombre"] == "Cliente Test"
    assert data["factura"]["numero_factura"] == "0001-00000001"


async def test_preview_envio_factura_no_confirmada(client, factura_pendiente, cliente_base, plantilla_envio):
    payload = {
        "factura_id": factura_pendiente.id,
        "cliente_id": cliente_base.id,
        "plantilla_id": plantilla_envio.id,
    }
    resp = await client.post("/api/envios/preview", json=payload)
    assert resp.status_code == 400
    assert resp.json()["code"] == "FACTURA_NOT_CONFIRMADA"


async def test_preview_envio_factura_not_found(client, cliente_base, plantilla_envio):
    payload = {
        "factura_id": "00000000-0000-0000-0000-000000000000",
        "cliente_id": cliente_base.id,
        "plantilla_id": plantilla_envio.id,
    }
    resp = await client.post("/api/envios/preview", json=payload)
    assert resp.status_code == 404
    assert resp.json()["code"] == "FACTURA_NOT_FOUND"


async def test_enviar_factura(client, factura_confirmada, cliente_base, plantilla_envio):
    payload = {
        "factura_id": factura_confirmada.id,
        "cliente_id": cliente_base.id,
        "plantilla_id": plantilla_envio.id,
    }
    with (
        patch("routers.envios.get_credentials", return_value=MagicMock()),
        patch("services.gmail_sender_service.enviar_email", return_value="msg_id_456") as mock_gmail,
        patch("services.sheets_writer_service.registrar_envio", return_value=None),
    ):
        resp = await client.post("/api/envios/enviar", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["gmail_message_id"] == "msg_id_456"
    assert "historial_id" in data
    mock_gmail.assert_called_once()


async def test_enviar_factura_google_not_connected(client, factura_confirmada, cliente_base, plantilla_envio):
    payload = {
        "factura_id": factura_confirmada.id,
        "cliente_id": cliente_base.id,
        "plantilla_id": plantilla_envio.id,
    }
    resp = await client.post("/api/envios/enviar", json=payload)
    assert resp.status_code == 403
    assert resp.json()["code"] == "GOOGLE_NOT_CONNECTED"
