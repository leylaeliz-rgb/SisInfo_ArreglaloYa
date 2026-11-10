CREATE TABLE IF NOT EXISTS archivos_verificacion (
    documento_id BIGINT PRIMARY KEY REFERENCES documentos_verificacion(id) ON DELETE RESTRICT,
    contenido BYTEA NOT NULL CHECK (octet_length(contenido) BETWEEN 1 AND 2097152)
);
