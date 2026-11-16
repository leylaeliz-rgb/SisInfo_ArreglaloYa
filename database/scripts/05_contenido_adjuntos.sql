BEGIN;
CREATE TABLE IF NOT EXISTS contenido_adjuntos (
    clave UUID PRIMARY KEY,
    fotografia_id BIGINT UNIQUE REFERENCES fotografias_solicitud(id) ON DELETE RESTRICT,
    comprobante_id BIGINT UNIQUE REFERENCES comprobantes_pago(id) ON DELETE RESTRICT,
    adjunto_reclamo_id BIGINT UNIQUE REFERENCES adjuntos_reclamo(id) ON DELETE RESTRICT,
    contenido BYTEA NOT NULL CHECK (octet_length(contenido) BETWEEN 1 AND 2097152),
    tipo_mime VARCHAR(100) NOT NULL,
    CHECK (num_nonnulls(fotografia_id, comprobante_id, adjunto_reclamo_id)=1)
);
COMMIT;
