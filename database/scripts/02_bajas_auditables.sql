BEGIN;

CREATE TABLE IF NOT EXISTS sesiones_revocadas (
    id UUID PRIMARY KEY,
    expira_en TIMESTAMPTZ NOT NULL
);

ALTER TABLE calificaciones_trabajador
    ADD COLUMN IF NOT EXISTS retirada_en TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS reversiones_pago_simulado (
    pago_id BIGINT PRIMARY KEY REFERENCES pagos(id) ON DELETE RESTRICT,
    registrada_por BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    motivo TEXT NOT NULL,
    registrada_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
