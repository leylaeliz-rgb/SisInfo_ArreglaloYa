-- Migración: soporte para escalamiento y reasignación de reclamos.
-- Ejecutar una sola vez sobre la base de datos arreglalo_ya.

BEGIN;

-- Marca cuándo un reclamo ya fue escalado para evitar que el proceso
-- automático lo vuelva a escalar en cada ejecución.
ALTER TABLE reclamos
  ADD COLUMN IF NOT EXISTS escalado_en TIMESTAMPTZ;

-- Historial específico de cambios de responsable.
-- cambiado_por queda NULL cuando la reasignación la realiza el proceso automático.
CREATE TABLE IF NOT EXISTS historial_asignacion_reclamo (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reclamo_id BIGINT NOT NULL
    REFERENCES reclamos(id) ON DELETE CASCADE,
  responsable_anterior BIGINT
    REFERENCES usuarios(id) ON DELETE SET NULL,
  responsable_nuevo BIGINT
    REFERENCES usuarios(id) ON DELETE SET NULL,
  cambiado_por BIGINT
    REFERENCES usuarios(id) ON DELETE SET NULL,
  origen VARCHAR(20) NOT NULL
    CHECK (origen IN ('automatico', 'manual')),
  motivo TEXT NOT NULL,
  cambiado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Facilita buscar el historial de un reclamo en orden cronológico.
CREATE INDEX IF NOT EXISTS idx_historial_asignacion_reclamo_fecha
  ON historial_asignacion_reclamo (reclamo_id, cambiado_en DESC);

-- Facilita localizar reclamos que todavía deben ser revisados por el proceso automático.
CREATE INDEX IF NOT EXISTS idx_reclamos_pendientes_escalamiento
  ON reclamos (presentado_en)
  WHERE estado IN ('pendiente', 'en_revision') AND escalado_en IS NULL;

COMMIT;
