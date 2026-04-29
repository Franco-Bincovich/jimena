# CLAUDE.md — Sistema Facturas

## Qué es este proyecto

Sistema de gestión de facturas que permite cargar, procesar y administrar comprobantes en PDF
usando OCR y la API de Anthropic para extracción inteligente de datos.

## Stack

- Backend: Python 3.11 + FastAPI
- DB: SQLite (desarrollo) → PostgreSQL/Supabase (producción)
- ORM: SQLAlchemy 2.0
- IA: Anthropic Claude (anthropic SDK)
- Auth: Google OAuth 2.0
- Deploy: AWS

## Estructura de carpetas

```
backend/
├── main.py              ← FastAPI app, CORS, montaje de /uploads
├── database.py          ← SQLite + SQLAlchemy (SessionLocal, Base, get_db)
├── config/
│   └── settings.py      ← pydantic-settings, única fuente de config
├── routers/             ← endpoints, sin lógica de negocio (límite: 80 líneas)
├── services/            ← lógica de negocio (límite: 150 líneas)
├── repositories/        ← único acceso a la DB (límite: 100 líneas)
├── schemas/             ← modelos Pydantic de entrada y salida
├── middleware/
│   └── error_handler.py ← handler global de errores
├── utils/
│   ├── logger.py        ← logger JSON estructurado
│   └── errors.py        ← clase AppError
├── uploads/             ← PDFs temporales (no commitear contenido)
└── migrations/          ← SQL versionado del schema
```

## Convenciones de código

- Seguir ORDEN-Y-LEGIBILIDAD.md y SEGURIDAD-PENTEST.md de la agencia
- Errores: siempre `AppError(message, code, status_code)` desde `utils.errors`
- Formato de error: `{"error": True, "message": "...", "code": "SNAKE_CASE"}`
- Logs: solo eventos de negocio — nunca passwords, tokens ni API keys
- No usar `os.environ` directamente — siempre importar `settings` desde `config.settings`
- No usar `print()` — usar el `logger` centralizado de `utils.logger`
- Docstrings obligatorios en todas las funciones de services

## Flujo de capas

```
router → service → repository → DB
              ↘ integración → Anthropic
```

## Reglas para Claude

- No modificar archivos fuera del scope de la tarea
- Si un archivo supera el límite de líneas, proponer cómo dividirlo antes de escribir
- Ante la duda entre dos enfoques, preguntar antes de implementar
- IDs externos siempre como `UUID` tipado — nunca como `str` sin validar
- Los mensajes de error no revelan información interna del sistema

## Estado actual del proyecto

### Implementado
- Estructura base del proyecto (capas, configuración, logger, error handler)
- Endpoint GET /health
- Configuración CORS para localhost:5173

### En desarrollo
- (pendiente)

### Deuda técnica conocida
- Migrar de SQLite a Supabase/PostgreSQL antes de producción
- Agregar RLS cuando se migre a Supabase
- Configurar pre-commit con Ruff
