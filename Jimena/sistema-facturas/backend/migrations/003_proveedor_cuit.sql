-- Migración 003: renombrar columna telefono → cuit en proveedores
ALTER TABLE proveedores RENAME COLUMN telefono TO cuit;
