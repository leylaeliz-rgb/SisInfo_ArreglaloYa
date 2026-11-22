/*
    ARREGLALO YA - ACTUALIZACION DE LA BASE DE DATOS
    Motor: PostgreSQL | Base: arreglalo_ya

    QUE HACE:
    Agrega lo que el backend (NestJS) ya usa y que no estaba en el script
    inicial de la base de datos:
      - tabla sesiones_revocadas            (cierre de sesion / AuthGuard)
      - tabla reversiones_pago_simulado     (devolucion de anticipos simulados)
      - tabla archivos_verificacion         (contenido de documentos de verificacion)
      - tabla contenido_adjuntos            (fotos, comprobantes y adjuntos de reclamos)
      - columna calificaciones_trabajador.retirada_en

    SEGURIDAD:
    - No borra ni modifica tablas, columnas ni datos existentes.
    - Se puede ejecutar mas de una vez (usa IF NOT EXISTS).
    - Todo ocurre en una sola transaccion: si algo falla, no se aplica nada.

    COMO USARLO:
    1. Conectarse a la base arreglalo_ya en pgAdmin o VS Code.
    2. Ejecutar este archivo completo.
    3. Revisar el resultado de la consulta final (todas las filas deben decir true).
    4. Reiniciar el backend.

    NOTA: las definiciones se dedujeron de como el codigo del backend usa
    estas tablas. Si el equipo ya tiene un script oficial con ellas, usar
    ese y no este.
*/

BEGIN;

/* ============================================================
   1. SESIONES REVOCADAS (cierre de sesion)
   El AuthGuard consulta esta tabla en cada peticion con token.
   ============================================================ */

CREATE TABLE IF NOT EXISTS sesiones_revocadas (
    id          UUID PRIMARY KEY,
    expira_en   TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sesiones_revocadas_expira
    ON sesiones_revocadas(expira_en);

/* ============================================================
   2. REVERSION DE PAGOS SIMULADOS
   Una fila por anticipo revertido. pago_id es unico (el codigo usa
   ON CONFLICT (pago_id)).
   ============================================================ */

CREATE TABLE IF NOT EXISTS reversiones_pago_simulado (
    pago_id         BIGINT PRIMARY KEY REFERENCES pagos(id) ON DELETE RESTRICT,
    registrada_por  BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    motivo          TEXT NOT NULL,
    registrada_en   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

/* ============================================================
   3. CONTENIDO DE DOCUMENTOS DE VERIFICACION
   Guarda el archivo (binario) de cada documento de verificacion.
   ============================================================ */

CREATE TABLE IF NOT EXISTS archivos_verificacion (
    documento_id    BIGINT PRIMARY KEY REFERENCES documentos_verificacion(id) ON DELETE RESTRICT,
    contenido       BYTEA NOT NULL
);

/* ============================================================
   4. CONTENIDO DE ADJUNTOS
   Guarda el binario de fotografias de solicitudes, comprobantes de pago
   y adjuntos de reclamos. Cada fila pertenece a exactamente uno de ellos.
   ============================================================ */

CREATE TABLE IF NOT EXISTS contenido_adjuntos (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    clave               TEXT NOT NULL UNIQUE,
    fotografia_id       BIGINT REFERENCES fotografias_solicitud(id) ON DELETE RESTRICT,
    comprobante_id      BIGINT REFERENCES comprobantes_pago(id) ON DELETE RESTRICT,
    adjunto_reclamo_id  BIGINT REFERENCES adjuntos_reclamo(id) ON DELETE RESTRICT,
    contenido           BYTEA NOT NULL,
    tipo_mime           VARCHAR(100),
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (num_nonnulls(fotografia_id, comprobante_id, adjunto_reclamo_id) = 1)
);

/* ============================================================
   5. CALIFICACIONES: marca de calificacion retirada
   Columna opcional; las calificaciones existentes quedan en NULL
   (es decir, vigentes).
   ============================================================ */

ALTER TABLE calificaciones_trabajador
    ADD COLUMN IF NOT EXISTS retirada_en TIMESTAMPTZ;

COMMIT;

/* ============================================================
   6. COMPROBACION
   Todas las filas deben mostrar existe = true.
   ============================================================ */

SELECT 'tabla sesiones_revocadas' AS elemento,
       to_regclass('public.sesiones_revocadas') IS NOT NULL AS existe
UNION ALL
SELECT 'tabla reversiones_pago_simulado',
       to_regclass('public.reversiones_pago_simulado') IS NOT NULL
UNION ALL
SELECT 'tabla archivos_verificacion',
       to_regclass('public.archivos_verificacion') IS NOT NULL
UNION ALL
SELECT 'tabla contenido_adjuntos',
       to_regclass('public.contenido_adjuntos') IS NOT NULL
UNION ALL
SELECT 'columna calificaciones_trabajador.retirada_en',
       EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public'
                 AND table_name = 'calificaciones_trabajador'
                 AND column_name = 'retirada_en');
