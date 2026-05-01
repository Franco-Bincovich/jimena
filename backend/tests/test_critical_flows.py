from datetime import datetime
from types import SimpleNamespace
from unittest.mock import patch

import pytest

from repositories import envio_repo, factura_repo
from services import template_service


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
