-- Commit 2: configuración persistente del plazo de atención administrativa
-- Este plazo NO reemplaza los 7 días naturales para que el cliente presente
-- un reclamo. Controla cuánto tiempo puede permanecer abierto sin resolverse.

BEGIN;

CREATE TABLE IF NOT EXISTS configuracion_escalamiento_reclamos (
  id SMALLINT PRIMARY KEY CHECK (id = 1),
  plazo_atencion_horas INTEGER NOT NULL DEFAULT 48
    CHECK (plazo_atencion_horas BETWEEN 1 AND 720),
  actualizado_por BIGINT
    REFERENCES usuarios(id) ON DELETE SET NULL,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- La configuración inicial se crea una sola vez. Reejecutar la migración
-- no sobrescribe el valor que haya definido un administrador.
INSERT INTO configuracion_escalamiento_reclamos (id, plazo_atencion_horas)
VALUES (1, 48)
ON CONFLICT (id) DO NOTHING;

-- Auditoría de cambios del plazo. Solo se insertará una fila cuando el valor
-- cambie realmente mediante el endpoint administrativo.
CREATE TABLE IF NOT EXISTS historial_configuracion_escalamiento_reclamos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  plazo_anterior INTEGER NOT NULL,
  plazo_nuevo INTEGER NOT NULL
    CHECK (plazo_nuevo BETWEEN 1 AND 720),
  cambiado_por BIGINT
    REFERENCES usuarios(id) ON DELETE SET NULL,
  cambiado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historial_configuracion_escalamiento_fecha
  ON historial_configuracion_escalamiento_reclamos (cambiado_en DESC);

COMMIT;
