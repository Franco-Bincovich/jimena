from datetime import datetime

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
from main import app
from models import Cliente, Plantilla, Proveedor
from repositories import factura_repo

TEST_DB_URL = "sqlite:///:memory:"


@pytest.fixture
def db_session():
    engine = create_engine(
        TEST_DB_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest_asyncio.fixture
async def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
def proveedor_base(db_session):
    p = Proveedor(nombre="Proveedor Test", email="proveedor@test.com")
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)
    return p


@pytest.fixture
def cliente_base(db_session):
    c = Cliente(nombre="Cliente Test", email="cliente@test.com", cuit="30718845420")
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)
    return c


@pytest.fixture
def plantilla_pedido(db_session):
    p = Plantilla(
        nombre="Pedido Mensual",
        tipo="pedido",
        asunto="Pedido {{mes}} {{año}} - {{proveedor}}",
        cuerpo="Estimado {{proveedor}}, pedido de {{mes}} {{año}}.\n\n{{clientes}}",
    )
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)
    return p


@pytest.fixture
def plantilla_envio(db_session):
    p = Plantilla(
        nombre="Envio Factura",
        tipo="envio",
        asunto="Factura {{numero_factura}} - {{mes}} {{año}}",
        cuerpo="Estimado {{nombre_destinatario}}, adjunto factura {{numero_factura}} por {{monto_total}}.",
    )
    db_session.add(p)
    db_session.commit()
    db_session.refresh(p)
    return p


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
