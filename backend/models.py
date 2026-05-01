import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=_uuid)
    email = Column(String(200), nullable=False, unique=True, index=True)
    password_hash = Column(Text, nullable=False)
    nombre = Column(String(200), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class Proveedor(Base):
    __tablename__ = "proveedores"

    id = Column(String(36), primary_key=True, default=_uuid)
    nombre = Column(String(200), nullable=False)
    email = Column(String(200), nullable=True)
    cuit = Column(String(20), nullable=True, index=True)
    notas = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(String(36), primary_key=True, default=_uuid)
    nombre = Column(String(200), nullable=False)
    email = Column(String(200), nullable=True)
    cuit = Column(String(20), nullable=True, index=True)
    telefono = Column(String(50), nullable=True)
    notas = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Plantilla(Base):
    __tablename__ = "plantillas"

    id = Column(String(36), primary_key=True, default=_uuid)
    nombre = Column(String(200), nullable=False)
    tipo = Column(String(20), nullable=False)  # 'pedido' | 'envio'
    asunto = Column(String(500), nullable=False)
    cuerpo = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Factura(Base):
    __tablename__ = "facturas"

    id = Column(String(36), primary_key=True, default=_uuid)
    nombre_archivo = Column(String(500), nullable=False)
    nombre_en_drive = Column(String(500), nullable=True)
    drive_file_id = Column(String(200), nullable=True)
    drive_url = Column(String(1000), nullable=True)
    numero_factura = Column(String(100), nullable=True)
    fecha_factura = Column(DateTime, nullable=True)
    monto_total = Column(Float, nullable=True)
    descripcion = Column(Text, nullable=True)
    proveedor_id = Column(String(36), ForeignKey("proveedores.id"), nullable=True)
    fecha_desde = Column(Date, nullable=True)
    fecha_hasta = Column(Date, nullable=True)
    gmail_message_id = Column(String(200), nullable=True)
    estado = Column(String(30), nullable=False, default="pendiente_confirmacion")
    fecha_recepcion = Column(DateTime, default=datetime.utcnow)

    proveedor = relationship("Proveedor", backref="facturas")


class FacturaCliente(Base):
    __tablename__ = "facturas_clientes"

    id = Column(String(36), primary_key=True, default=_uuid)
    factura_id = Column(String(36), ForeignKey("facturas.id"), nullable=False)
    cliente_id = Column(String(36), ForeignKey("clientes.id"), nullable=False)

    factura = relationship("Factura", backref="clientes_asociados")
    cliente = relationship("Cliente", backref="facturas_asociadas")


class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(String(36), primary_key=True, default=_uuid)
    proveedor_id = Column(String(36), ForeignKey("proveedores.id"), nullable=False)
    mes = Column(Integer, nullable=False)
    anio = Column(Integer, nullable=False)
    fecha_desde = Column(DateTime, nullable=True)
    fecha_hasta = Column(DateTime, nullable=True)
    estado = Column(String(20), nullable=False, default="borrador")  # 'borrador' | 'enviado'
    gmail_message_id = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    proveedor = relationship("Proveedor", backref="pedidos")


class PedidoItem(Base):
    __tablename__ = "pedido_items"

    id = Column(String(36), primary_key=True, default=_uuid)
    pedido_id = Column(String(36), ForeignKey("pedidos.id"), nullable=False)
    cliente_id = Column(String(36), ForeignKey("clientes.id"), nullable=False)
    consultas_api = Column(Integer, nullable=True)

    pedido = relationship("Pedido", backref="items")
    cliente = relationship("Cliente", backref="pedido_items")


class HistorialEnvio(Base):
    __tablename__ = "historial_envios"

    id = Column(String(36), primary_key=True, default=_uuid)
    tipo = Column(String(20), nullable=False)  # 'pedido' | 'envio'
    destinatario_email = Column(String(200), nullable=False)
    destinatario_nombre = Column(String(200), nullable=True)
    asunto = Column(String(500), nullable=False)
    estado = Column(String(20), nullable=False)  # 'enviado' | 'error'
    error_msg = Column(Text, nullable=True)
    factura_id = Column(String(36), ForeignKey("facturas.id"), nullable=True)
    gmail_message_id = Column(String(200), nullable=True)
    sheets_row = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    factura = relationship("Factura", backref="historial_envios")


class ContactoCC(Base):
    __tablename__ = "contactos_cc"

    id = Column(String(36), primary_key=True, default=_uuid)
    nombre = Column(String(200), nullable=False)
    email = Column(String(200), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class GoogleConfig(Base):
    """Singleton de configuración OAuth y recursos de Google. Siempre id=1."""

    __tablename__ = "google_config"

    id = Column(Integer, primary_key=True)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_expiry = Column(DateTime(timezone=True), nullable=True)
    sheet_id = Column(String(200), nullable=True)
    drive_folder_id = Column(String(200), nullable=True)
    empresa_nombre = Column(String(200), nullable=True)
    empresa_email = Column(String(200), nullable=True)
    google_email = Column(String(200), nullable=True)
    oauth_state = Column(String(500), nullable=True)
