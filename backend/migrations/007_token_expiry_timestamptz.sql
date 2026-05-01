-- La columna token_expiry ya fue creada como TIMESTAMPTZ en 001_initial_schema.sql.
-- Esta migración alinea el modelo SQLAlchemy (DateTime(timezone=True)) con ese tipo
-- para que SQLAlchemy devuelva datetimes aware-UTC al leer de Supabase/PostgreSQL.
-- No requiere ALTER TABLE en producción; se incluye para documentar el cambio de modelo.

-- No-op: columna ya es TIMESTAMPTZ.
-- ALTER TABLE google_config ALTER COLUMN token_expiry TYPE TIMESTAMPTZ;
