-- migrations/001_initial_schema.sql
-- Schema inicial del sistema de facturas.
-- Ejecutar contra PostgreSQL/Supabase al hacer el primer deploy en producción.
-- En desarrollo, SQLAlchemy crea las tablas en SQLite vía Base.metadata.create_all().
--
-- Decisiones de diseño transversales:
--   - UUIDs como PKs: evita colisiones al fusionar datos de múltiples fuentes
--     (emails, Drive, Sheets) y no expone secuencias predecibles a la API.
--   - TEXT para campos de longitud variable: más flexible que VARCHAR en Postgres
--     y no hay penalidad de rendimiento real para el volumen esperado.
--   - TIMESTAMPTZ: almacena en UTC, presenta en zona local. Crítico para
--     evitar bugs de horario en Argentina (UTC-3) durante cambios de horario.


-- ─── Proveedores ─────────────────────────────────────────────────────────────
-- Empresas que emiten facturas al negocio (e.g. proveedor de consultas API).
-- Separado de Clientes porque tiene un ciclo de vida distinto: se configura
-- una sola vez y se asocia a pedidos mensuales recurrentes.

CREATE TABLE proveedores (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre       TEXT        NOT NULL,
    email        TEXT,
    telefono     TEXT,
    notas        TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);


-- ─── Clientes ─────────────────────────────────────────────────────────────────
-- Empresas que reciben los envíos generados por el sistema.
-- El CUIT es el campo clave para el matching automático desde facturas en PDF:
-- Claude extrae CUITs del documento y los cruza contra esta tabla para asociar
-- automáticamente la factura al cliente correcto sin intervención humana.
-- Se indexa porque todas las búsquedas de matching pasan por este campo.

CREATE TABLE clientes (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre       TEXT        NOT NULL,
    email        TEXT,
    cuit         TEXT,
    telefono     TEXT,
    notas        TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clientes_cuit ON clientes (cuit);


-- ─── Plantillas ───────────────────────────────────────────────────────────────
-- Templates de email reutilizables para pedidos y envíos.
-- tipo='pedido': se usa al solicitar información al proveedor.
-- tipo='envio': se usa al reenviar la factura procesada al cliente.
-- Separados de la lógica de envío para permitir edición sin tocar código.

CREATE TABLE plantillas (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre       TEXT        NOT NULL,
    tipo         TEXT        NOT NULL CHECK (tipo IN ('pedido', 'envio')),
    asunto       TEXT        NOT NULL,
    cuerpo       TEXT        NOT NULL,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);


-- ─── Facturas ─────────────────────────────────────────────────────────────────
-- Comprobantes recibidos por email y procesados por el sistema.
-- proveedor_id es nullable porque el matching con el proveedor puede fallar
-- en la extracción automática y resolverse manualmente después.
-- estado='pendiente_confirmacion': Claude extrajo los datos, esperando revisión.
-- estado='confirmada': el usuario validó los datos antes de distribuir.
-- gmail_message_id guarda el ID del email origen para vincular respuestas.
-- drive_file_id y drive_url persisten la ubicación en Drive del PDF archivado.

CREATE TABLE facturas (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_archivo    TEXT        NOT NULL,
    nombre_en_drive   TEXT,
    drive_file_id     TEXT,
    drive_url         TEXT,
    numero_factura    TEXT,
    fecha_factura     DATE,
    monto_total       NUMERIC(12, 2),
    descripcion       TEXT,
    proveedor_id      UUID        REFERENCES proveedores(id) ON DELETE SET NULL,
    gmail_message_id  TEXT,
    estado            TEXT        NOT NULL DEFAULT 'pendiente_confirmacion'
                                  CHECK (estado IN ('pendiente_confirmacion', 'confirmada')),
    fecha_recepcion   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_facturas_proveedor ON facturas (proveedor_id);
CREATE INDEX idx_facturas_estado    ON facturas (estado);


-- ─── Facturas ↔ Clientes (relación N:M) ──────────────────────────────────────
-- Una factura puede asociarse a múltiples clientes porque distintos clientes
-- pueden compartir el mismo CUIT (e.g. razones sociales relacionadas).
-- El matching automático puede producir 0, 1 o N asociaciones por factura.

CREATE TABLE facturas_clientes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factura_id  UUID NOT NULL REFERENCES facturas(id)  ON DELETE CASCADE,
    cliente_id  UUID NOT NULL REFERENCES clientes(id)  ON DELETE CASCADE
);

CREATE INDEX idx_facturas_clientes_factura ON facturas_clientes (factura_id);
CREATE INDEX idx_facturas_clientes_cliente ON facturas_clientes (cliente_id);


-- ─── Pedidos ──────────────────────────────────────────────────────────────────
-- Solicitudes mensuales de información enviadas al proveedor.
-- mes + anio + proveedor_id identifica unívocamente un pedido de período.
-- fecha_desde / fecha_hasta son el rango de consulta que se le pide al proveedor,
-- puede diferir del mes calendario (ej: del 26 al 25 del mes siguiente).
-- gmail_message_id guarda el thread del email enviado para hacer follow-up.

CREATE TABLE pedidos (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    proveedor_id      UUID        NOT NULL REFERENCES proveedores(id),
    mes               INTEGER     NOT NULL CHECK (mes BETWEEN 1 AND 12),
    anio              INTEGER     NOT NULL,
    fecha_desde       DATE,
    fecha_hasta       DATE,
    estado            TEXT        NOT NULL DEFAULT 'borrador'
                                  CHECK (estado IN ('borrador', 'enviado')),
    gmail_message_id  TEXT,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_pedidos_periodo
    ON pedidos (proveedor_id, mes, anio);


-- ─── Pedido Items ─────────────────────────────────────────────────────────────
-- Líneas del pedido: qué se le factura a cada cliente dentro del período.
-- consultas_api es el dato que se extrae de la factura del proveedor y se
-- distribuye al cliente correspondiente. Nullable porque puede completarse
-- después de recibir la factura.

CREATE TABLE pedido_items (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id       UUID     NOT NULL REFERENCES pedidos(id)  ON DELETE CASCADE,
    cliente_id      UUID     NOT NULL REFERENCES clientes(id),
    consultas_api   INTEGER
);

CREATE INDEX idx_pedido_items_pedido  ON pedido_items (pedido_id);
CREATE INDEX idx_pedido_items_cliente ON pedido_items (cliente_id);


-- ─── Historial de Envíos ──────────────────────────────────────────────────────
-- Registro inmutable de cada email enviado por el sistema.
-- Permite auditar qué se mandó, a quién, cuándo y si llegó correctamente.
-- factura_id es nullable: los envíos de pedidos no están ligados a una factura.
-- sheets_row guarda la fila de Google Sheets donde se registró el envío,
-- para poder actualizar el estado directamente en el spreadsheet del cliente.
-- error_msg captura el detalle técnico solo cuando estado='error'.

CREATE TABLE historial_envios (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo                TEXT        NOT NULL CHECK (tipo IN ('pedido', 'envio')),
    destinatario_email  TEXT        NOT NULL,
    destinatario_nombre TEXT,
    asunto              TEXT        NOT NULL,
    estado              TEXT        NOT NULL CHECK (estado IN ('enviado', 'error')),
    error_msg           TEXT,
    factura_id          UUID        REFERENCES facturas(id) ON DELETE SET NULL,
    gmail_message_id    TEXT,
    sheets_row          INTEGER,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_historial_factura ON historial_envios (factura_id);
CREATE INDEX idx_historial_estado  ON historial_envios (estado);


-- ─── Google Config (singleton) ────────────────────────────────────────────────
-- Configuración OAuth y recursos de Google: siempre una sola fila con id=1.
-- Se usa singleton porque el sistema opera con una única cuenta de Google
-- y no hay beneficio en generalizar a multi-cuenta en este contexto.
-- access_token y refresh_token se almacenan encriptados en producción.
-- token_expiry se usa para detectar si el access_token expiró antes de llamar
-- a la API, evitando roundtrips innecesarios.

CREATE TABLE google_config (
    id                INTEGER     PRIMARY KEY DEFAULT 1,
    access_token      TEXT,
    refresh_token     TEXT,
    token_expiry      TIMESTAMPTZ,
    sheet_id          TEXT,
    drive_folder_id   TEXT,
    empresa_nombre    TEXT,
    empresa_email     TEXT,
    google_email      TEXT,
    CONSTRAINT singleton CHECK (id = 1)
);
