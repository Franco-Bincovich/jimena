-- Migración 005: tabla de contactos en copia (CC)
CREATE TABLE IF NOT EXISTS contactos_cc (
    id          TEXT PRIMARY KEY,
    nombre      TEXT NOT NULL,
    email       TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
