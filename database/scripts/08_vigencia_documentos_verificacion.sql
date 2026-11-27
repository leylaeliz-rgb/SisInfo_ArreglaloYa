BEGIN;

/* 1. Configuración de tipos de documento (obligatoriedad y días de alerta previa) */
CREATE TABLE IF NOT EXISTS tipos_documento_verificacion (
    tipo                VARCHAR(30) PRIMARY KEY
                        CHECK (tipo IN ('identidad', 'antecedentes', 'habilidades', 'referencias_reputacion')),
    nombre              VARCHAR(80) NOT NULL,
    obligatorio         BOOLEAN NOT NULL DEFAULT FALSE,
    dias_alerta_previa  INTEGER NOT NULL DEFAULT 15 CHECK (dias_alerta_previa BETWEEN 1 AND 90)
);

INSERT INTO tipos_documento_verificacion (tipo, nombre, obligatorio, dias_alerta_previa) VALUES
    ('identidad',              'Cédula de identidad',       TRUE,  15),
    ('antecedentes',           'Certificado de antecedentes', TRUE, 15),
    ('habilidades',            'Certificado de habilidades',  FALSE, 15),
    ('referencias_reputacion', 'Referencias de reputación',   FALSE, 15)
ON CONFLICT (tipo) DO NOTHING;

/* 2. Control de vigencia y cadena de renovación en documentos_verificacion */
ALTER TABLE documentos_verificacion
    ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE,
    ADD COLUMN IF NOT EXISTS estado_vigencia VARCHAR(20) NOT NULL DEFAULT 'vigente'
        CHECK (estado_vigencia IN ('vigente', 'por_vencer', 'vencido', 'reemplazado')),
    ADD COLUMN IF NOT EXISTS reemplazado_por_id BIGINT REFERENCES documentos_verificacion(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_documentos_vigencia
    ON documentos_verificacion(estado_vigencia, fecha_vencimiento);

/* 3. Tabla de alertas preventivas y de vencimiento */
CREATE TABLE IF NOT EXISTS alertas_documentos (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trabajador_id   BIGINT NOT NULL REFERENCES perfiles_trabajador(usuario_id) ON DELETE RESTRICT,
    documento_id    BIGINT NOT NULL REFERENCES documentos_verificacion(id) ON DELETE RESTRICT,
    tipo_alerta     VARCHAR(20) NOT NULL CHECK (tipo_alerta IN ('por_vencer', 'vencido')),
    mensaje         TEXT NOT NULL,
    leida           BOOLEAN NOT NULL DEFAULT FALSE,
    creada_en       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (documento_id, tipo_alerta)
);

CREATE INDEX IF NOT EXISTS idx_alertas_documentos_trabajador
    ON alertas_documentos(trabajador_id, leida, creada_en DESC);

COMMIT;