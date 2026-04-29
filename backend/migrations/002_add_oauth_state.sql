-- migrations/002_add_oauth_state.sql
-- Agrega oauth_state a google_config para la validación anti-CSRF del flujo OAuth 2.0.
--
-- Por qué se necesita este campo:
--   OAuth 2.0 exige que el servidor genere un valor aleatorio (state) antes de redirigir
--   al proveedor de identidad. Cuando Google devuelve al callback, el sistema verifica que
--   el state recibido coincide con el guardado. Si no coincide, es un ataque CSRF.
--   Ver SEGURIDAD-PENTEST.md — Sección 2 (Autenticación y autorización).
--
-- Se usa TEXT en lugar de VARCHAR(N) porque:
--   El state generado por google-auth-oauthlib puede ser una string de longitud variable
--   dependiendo de la versión. TEXT cubre cualquier longitud futura sin migraciones.
--
-- Se limpia (SET NULL) inmediatamente después de un callback exitoso para que
--   un state capturado no pueda reutilizarse.

ALTER TABLE google_config ADD COLUMN oauth_state TEXT;
