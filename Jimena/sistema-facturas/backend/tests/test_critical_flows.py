from datetime import datetime
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest

from repositories import envio_repo, factura_repo
from services import template_service


# ─── LOCAL FIXTURES ──────────────────────────────────────────────────────────

@pytest.fixture
def factura_confirmada(db_session, proveedor_base, cliente_base):
    f = factura_repo.create(db_session, {
        "nombre_archivo": "test.pdf",
        "numero_factura": "0001-00000001",
        "fecha_factura": datetime(2025, 3, 1),
        "monto_total": 10000.0,
        "estado": "confirmada",
        "proveedor_id": proveedor_base.id,
    })
    factura_repo.create_cliente_asociado(db_session, f.id, cliente_base.id)
    return f


@pytest.fixture
def factura_pendiente(db_session, proveedor_base):
    return factura_repo.create(db_session, {
        "nombre_archivo": "pending.pdf",
        "estado": "pendiente_confirmacion",
        "proveedor_id": proveedor_base.id,
    })


# ─── CRUD BASE (8) ──────────────────────────────────────────────────────────

async def test_crear_proveedor(client):
    resp = await client.post("/api/proveedores", json={"nombre": "Nuevo Prov", "email": "nuevo@test.com"})
    assert resp.status_code == 201
    assert resp.json()["nombre"] == "Nuevo Prov"


async def test_listar_proveedores(client, proveedor_base):
    resp = await client.get("/api/proveedores")
    assert resp.status_code == 200
    nombres = [p["nombre"] for p in resp.json()]
    assert "Proveedor Test" in nombres


async def test_actualizar_proveedor(client, proveedor_base):
    resp = await client.put(
        f"/api/proveedores/{proveedor_base.id}",
        json={"nombre": "Prov Actualizado"},
    )
    assert resp.status_code == 200
    assert resp.json()["nombre"] == "Prov Actualizado"


async def test_eliminar_proveedor(client, proveedor_base):
    resp = await client.delete(f"/api/proveedores/{proveedor_base.id}")
    assert resp.status_code == 204
    lista = await client.get("/api/proveedores")
    ids = [p["id"] for p in lista.json()]
    assert proveedor_base.id not in ids


async def test_crear_cliente(client):
    resp = await client.post("/api/clientes", json={"nombre": "Nuevo Cliente", "cuit": "20123456789"})
    assert resp.status_code == 201
    assert resp.json()["cuit"] == "20123456789"


async def test_listar_clientes(client, cliente_base):
    resp = await client.get("/api/clientes")
    assert resp.status_code == 200
    cuits = [c["cuit"] for c in resp.json()]
    assert "30718845420" in cuits


async def test_crear_plantilla_pedido(client):
    resp = await client.post("/api/plantillas", json={
        "nombre": "Mi Plantilla",
        "tipo": "pedido",
        "asunto": "Asunto {{mes}}",
        "cuerpo": "Cuerpo {{proveedor}}",
    })
    assert resp.status_code == 201
    assert resp.json()["tipo"] == "pedido"


async def test_crear_plantilla_tipo_invalido(client):
    resp = await client.post("/api/plantillas", json={
        "nombre": "Plantilla Mala",
        "tipo": "invalido",
        "asunto": "Asunto",
        "cuerpo": "Cuerpo",
    })
    assert resp.status_code == 422


# ─── TEMPLATES (3) ──────────────────────────────────────────────────────────

def test_resolver_variables_pedido(plantilla_pedido, proveedor_base, cliente_base):
    item = SimpleNamespace(cliente=cliente_base, consultas_api=50)
    periodo = {
        "mes": 3, "anio": 2025,
        "fecha_desde": datetime(2025, 3, 1).date(),
        "fecha_hasta": datetime(2025, 3, 31).date(),
    }
    resultado = template_service.resolver_variables_pedido(
        plantilla_pedido, proveedor_base, [item], periodo
    )
    assert "marzo" in resultado["asunto"]
    assert "2025" in resultado["asunto"]
    assert proveedor_base.nombre in resultado["asunto"]
    assert "Cliente Test" in resultado["cuerpo"]


def test_resolver_variables_envio(plantilla_envio, cliente_base, factura_confirmada):
    resultado = template_service.resolver_variables_envio(
        plantilla_envio, cliente_base, factura_confirmada, []
    )
    assert "0001-00000001" in resultado["asunto"]
    assert "marzo" in resultado["asunto"]
    assert "Cliente Test" in resultado["cuerpo"]
    assert "$ 10.000,00" in resultado["cuerpo"]


def test_variables_desconocidas_preservadas(plantilla_pedido, proveedor_base, cliente_base):
    from models import Plantilla as PlantillaModel
    plantilla_con_var_extra = SimpleNamespace(
        asunto="Hola {{no_existe}} y {{proveedor}}",
        cuerpo="{{otro_desconocido}}",
    )
    item = SimpleNamespace(cliente=cliente_base, consultas_api=None)
    periodo = {
        "mes": 1, "anio": 2024,
        "fecha_desde": datetime(2024, 1, 1).date(),
        "fecha_hasta": datetime(2024, 1, 31).date(),
    }
    resultado = template_service.resolver_variables_pedido(
        plantilla_con_var_extra, proveedor_base, [item], periodo
    )
    assert "{{no_existe}}" in resultado["asunto"]
    assert proveedor_base.nombre in resultado["asunto"]
    assert "{{otro_desconocido}}" in resultado["cuerpo"]


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
        patch("services.drive_service.copiar_factura_cliente", return_value={"file_id": "f1", "url": "https://drive.test"}),
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


# ─── FACTURAS (2) ───────────────────────────────────────────────────────────

async def test_listar_facturas(client, factura_confirmada):
    resp = await client.get("/api/facturas")
    assert resp.status_code == 200
    ids = [f["id"] for f in resp.json()]
    assert factura_confirmada.id in ids


async def test_confirmar_factura(client, factura_pendiente, proveedor_base, cliente_base):
    payload = {
        "numero_factura": "0002-00000001",
        "fecha_factura": "15/03/2025",
        "monto_total": 5000.0,
        "proveedor_id": proveedor_base.id,
        "cliente_ids": [cliente_base.id],
    }
    with patch("services.drive_service.subir_factura_proveedor", side_effect=Exception("Drive no disponible")):
        resp = await client.put(f"/api/facturas/{factura_pendiente.id}/confirmar", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["estado"] == "confirmada"
    assert data["numero_factura"] == "0002-00000001"
    assert data["monto_total"] == 5000.0


# ─── GOOGLE CONFIG (2) ──────────────────────────────────────────────────────

async def test_get_config(client):
    resp = await client.get("/api/config")
    assert resp.status_code == 200
    data = resp.json()
    assert "connected" in data
    assert data["connected"] is False


async def test_update_config(client):
    resp = await client.put("/api/config", json={"empresa_nombre": "Mi Empresa SA"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["empresa_nombre"] == "Mi Empresa SA"


# ─── HISTORIAL (1) ──────────────────────────────────────────────────────────

async def test_listar_historial(client, db_session):
    envio_repo.create(
        db=db_session,
        tipo="pedido",
        destinatario_email="prov@test.com",
        destinatario_nombre="Prov Test",
        asunto="Test historial",
        estado="enviado",
        gmail_message_id="gm_test_001",
    )
    resp = await client.get("/api/historial")
    assert resp.status_code == 200
    historial = resp.json()
    assert len(historial) >= 1
    assert historial[0]["estado"] == "enviado"
    assert historial[0]["gmail_message_id"] == "gm_test_001"
