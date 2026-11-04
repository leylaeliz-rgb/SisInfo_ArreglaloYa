/*
    ARREGLALO YA - ESTRUCTURA INICIAL DE BASE DE DATOS
    Motor: PostgreSQL

    INSTRUCCIONES:
    1. Crear previamente la base de datos: arreglalo_ya
    2. Conectarse a arreglalo_ya desde VS Code o pgAdmin.
    3. Ejecutar este archivo completo.

    Alcance basado en el documento de Elicitación de Arréglalo Ya.
    Las reglas que requieren operaciones coordinadas (permisos, plazos,
    transiciones de estado y cálculos) deben validarse también en NestJS.
*/

BEGIN;

/* ============================================================
   1. USUARIOS, ROLES Y UBICACIONES
   ============================================================ */

CREATE TABLE IF NOT EXISTS roles (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo          VARCHAR(30) NOT NULL UNIQUE,
    nombre          VARCHAR(50) NOT NULL,
    descripcion     TEXT
);

CREATE TABLE IF NOT EXISTS usuarios (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_completo     VARCHAR(150) NOT NULL,
    telefono            VARCHAR(20) NOT NULL UNIQUE,
    telefono_verificado_en TIMESTAMPTZ,
    password_hash       TEXT NOT NULL,
    estado_cuenta       VARCHAR(20) NOT NULL DEFAULT 'activa'
                        CHECK (estado_cuenta IN ('activa', 'suspendida', 'inactiva', 'eliminada')),
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    eliminado_en        TIMESTAMPTZ,
    CHECK (
        (estado_cuenta = 'eliminada' AND eliminado_en IS NOT NULL)
        OR (estado_cuenta <> 'eliminada' AND eliminado_en IS NULL)
    )
);

CREATE TABLE IF NOT EXISTS usuario_roles (
    usuario_id      BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    rol_id          BIGINT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    asignado_en     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    asignado_por    BIGINT REFERENCES usuarios(id) ON DELETE RESTRICT,
    PRIMARY KEY (usuario_id, rol_id)
);

/*
   Una cuenta puede tener más de un rol. El cambio entre Cliente y
   Trabajador se maneja como contexto de sesión en la aplicación;
   no se crean cuentas duplicadas.
*/

CREATE TABLE IF NOT EXISTS zonas (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre          VARCHAR(120) NOT NULL,
    tipo            VARCHAR(20) NOT NULL
                    CHECK (tipo IN ('zona', 'otb', 'macrodistrito')),
    zona_padre_id   BIGINT REFERENCES zonas(id) ON DELETE RESTRICT,
    activa          BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (nombre, zona_padre_id)
);

CREATE TABLE IF NOT EXISTS categorias (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo          VARCHAR(40) NOT NULL UNIQUE,
    nombre          VARCHAR(100) NOT NULL UNIQUE,
    descripcion     TEXT,
    activa          BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

/* ============================================================
   2. PERFIL, ESPECIALIDADES, COBERTURA Y DISPONIBILIDAD
   ============================================================ */

CREATE TABLE IF NOT EXISTS perfiles_trabajador (
    usuario_id          BIGINT PRIMARY KEY REFERENCES usuarios(id) ON DELETE RESTRICT,
    zona_base_id        BIGINT NOT NULL REFERENCES zonas(id) ON DELETE RESTRICT,
    descripcion         TEXT,
    foto_perfil_key     TEXT,
    estado_verificacion VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                        CHECK (estado_verificacion IN ('pendiente', 'en_revision', 'requiere_informacion', 'aprobado', 'rechazado')),
    disponible          BOOLEAN NOT NULL DEFAULT FALSE,
    aprobado_en         TIMESTAMPTZ,
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trabajador_categorias (
    trabajador_id   BIGINT NOT NULL REFERENCES perfiles_trabajador(usuario_id) ON DELETE RESTRICT,
    categoria_id    BIGINT NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
    PRIMARY KEY (trabajador_id, categoria_id)
);

CREATE TABLE IF NOT EXISTS trabajador_zonas_cobertura (
    trabajador_id   BIGINT NOT NULL REFERENCES perfiles_trabajador(usuario_id) ON DELETE RESTRICT,
    zona_id         BIGINT NOT NULL REFERENCES zonas(id) ON DELETE RESTRICT,
    PRIMARY KEY (trabajador_id, zona_id)
);

CREATE TABLE IF NOT EXISTS horarios_trabajador (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trabajador_id   BIGINT NOT NULL REFERENCES perfiles_trabajador(usuario_id) ON DELETE RESTRICT,
    dia_semana      SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
    hora_inicio     TIME NOT NULL,
    hora_fin        TIME NOT NULL,
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    CHECK (hora_inicio < hora_fin),
    UNIQUE (trabajador_id, dia_semana, hora_inicio, hora_fin)
);

/* ============================================================
   3. VERIFICACION ADMINISTRATIVA DE TRABAJADORES
   ============================================================ */

CREATE TABLE IF NOT EXISTS solicitudes_verificacion (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trabajador_id       BIGINT NOT NULL REFERENCES perfiles_trabajador(usuario_id) ON DELETE RESTRICT,
    estado              VARCHAR(25) NOT NULL DEFAULT 'pendiente'
                        CHECK (estado IN ('pendiente', 'en_revision', 'requiere_informacion', 'aprobada', 'rechazada')),
    enviada_en          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revisada_por        BIGINT REFERENCES usuarios(id) ON DELETE RESTRICT,
    revisada_en         TIMESTAMPTZ,
    motivo_decision     TEXT,
    actualizado_en      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

/* Evita dos solicitudes de verificación abiertas del mismo trabajador. */
CREATE UNIQUE INDEX IF NOT EXISTS uq_verificacion_abierta_por_trabajador
    ON solicitudes_verificacion(trabajador_id)
    WHERE estado IN ('pendiente', 'en_revision', 'requiere_informacion');

CREATE TABLE IF NOT EXISTS documentos_verificacion (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    solicitud_verificacion_id BIGINT NOT NULL REFERENCES solicitudes_verificacion(id) ON DELETE RESTRICT,
    tipo_documento          VARCHAR(30) NOT NULL
                            CHECK (tipo_documento IN ('identidad', 'antecedentes', 'habilidades', 'referencias_reputacion')),
    nombre_archivo          VARCHAR(255) NOT NULL,
    almacenamiento_key      TEXT NOT NULL,
    tipo_mime               VARCHAR(100),
    tamano_bytes            BIGINT CHECK (tamano_bytes IS NULL OR tamano_bytes >= 0),
    estado_revision         VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                            CHECK (estado_revision IN ('pendiente', 'aprobado', 'rechazado')),
    subido_en               TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revisado_por            BIGINT REFERENCES usuarios(id) ON DELETE RESTRICT,
    revisado_en             TIMESTAMPTZ,
    observacion_revision    TEXT
);

CREATE TABLE IF NOT EXISTS revisiones_verificacion (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    solicitud_verificacion_id BIGINT NOT NULL REFERENCES solicitudes_verificacion(id) ON DELETE RESTRICT,
    criterio                VARCHAR(30) NOT NULL
                            CHECK (criterio IN ('identidad', 'antecedentes', 'habilidades', 'reputacion')),
    resultado               VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                            CHECK (resultado IN ('pendiente', 'aprobado', 'rechazado', 'requiere_informacion')),
    observaciones           TEXT,
    revisado_por            BIGINT REFERENCES usuarios(id) ON DELETE RESTRICT,
    revisado_en             TIMESTAMPTZ,
    UNIQUE (solicitud_verificacion_id, criterio)
);

/* ============================================================
   4. SOLICITUDES DE SERVICIO Y FOTOGRAFIAS
   ============================================================ */

CREATE TABLE IF NOT EXISTS solicitudes_servicio (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id              BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    categoria_id            BIGINT NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
    zona_id                 BIGINT NOT NULL REFERENCES zonas(id) ON DELETE RESTRICT,
    trabajador_destino_id  BIGINT REFERENCES perfiles_trabajador(usuario_id) ON DELETE RESTRICT,
    modalidad               VARCHAR(15) NOT NULL
                            CHECK (modalidad IN ('publica', 'directa')),
    titulo                  VARCHAR(150) NOT NULL,
    descripcion             TEXT NOT NULL,
    disponible_desde        TIMESTAMPTZ,
    disponible_hasta        TIMESTAMPTZ,
    urgente                 BOOLEAN NOT NULL DEFAULT FALSE,
    recargo_urgencia_pct    NUMERIC(5,2) NOT NULL DEFAULT 0.00
                            CHECK (recargo_urgencia_pct >= 0),
    estado                  VARCHAR(25) NOT NULL DEFAULT 'publicada'
                            CHECK (estado IN ('publicada', 'recibiendo_ofertas', 'en_negociacion', 'contratada', 'cancelada', 'archivada')),
    prioridad_nivel         INTEGER NOT NULL DEFAULT 1 CHECK (prioridad_nivel >= 1),
    prioridad_maxima_desde  TIMESTAMPTZ,
    cancelada_por           BIGINT REFERENCES usuarios(id) ON DELETE RESTRICT,
    motivo_cancelacion      TEXT,
    cancelada_en            TIMESTAMPTZ,
    creada_en               TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizada_en          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (disponible_hasta IS NULL OR disponible_desde IS NULL OR disponible_hasta > disponible_desde),
    CHECK (
        (modalidad = 'publica' AND trabajador_destino_id IS NULL)
        OR (modalidad = 'directa' AND trabajador_destino_id IS NOT NULL)
    ),
    CHECK (
        (urgente = TRUE AND recargo_urgencia_pct = 10.00)
        OR (urgente = FALSE AND recargo_urgencia_pct = 0.00)
    ),
    CHECK (
        (estado = 'cancelada' AND cancelada_en IS NOT NULL)
        OR (estado <> 'cancelada' AND cancelada_en IS NULL)
    )
);

/*
   La dirección exacta se separa de la solicitud pública para reducir
   el riesgo de exponerla en búsquedas o perfiles públicos. El backend
   debe limitar su lectura al cliente propietario, al trabajador contratado
   cuando corresponda y al personal administrativo autorizado.
*/
CREATE TABLE IF NOT EXISTS direcciones_privadas_solicitud (
    solicitud_id        BIGINT PRIMARY KEY REFERENCES solicitudes_servicio(id) ON DELETE RESTRICT,
    direccion_exacta    TEXT NOT NULL,
    referencia           TEXT,
    creada_en            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fotografias_solicitud (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    solicitud_id        BIGINT NOT NULL REFERENCES solicitudes_servicio(id) ON DELETE RESTRICT,
    nombre_archivo      VARCHAR(255) NOT NULL,
    almacenamiento_key  TEXT NOT NULL,
    tipo_mime           VARCHAR(100),
    subido_en           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

/* La cantidad máxima de 5 fotografías se valida en NestJS antes de insertar. */

CREATE TABLE IF NOT EXISTS historial_prioridad_solicitud (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    solicitud_id        BIGINT NOT NULL REFERENCES solicitudes_servicio(id) ON DELETE RESTRICT,
    prioridad_anterior INTEGER,
    prioridad_nueva    INTEGER NOT NULL CHECK (prioridad_nueva >= 1),
    motivo              TEXT,
    cambiado_en         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

/* ============================================================
   5. COTIZACIONES Y CONTRATACION
   ============================================================ */

CREATE TABLE IF NOT EXISTS cotizaciones (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    solicitud_id            BIGINT NOT NULL REFERENCES solicitudes_servicio(id) ON DELETE RESTRICT,
    trabajador_id           BIGINT NOT NULL REFERENCES perfiles_trabajador(usuario_id) ON DELETE RESTRICT,
    monto_mano_obra         NUMERIC(12,2) NOT NULL CHECK (monto_mano_obra >= 0),
    monto_materiales        NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (monto_materiales >= 0),
    materiales_incluidos    BOOLEAN NOT NULL DEFAULT FALSE,
    requiere_visita         BOOLEAN NOT NULL DEFAULT FALSE,
    costo_transporte        NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (costo_transporte >= 0),
    monto_estimado_total    NUMERIC(12,2) NOT NULL CHECK (monto_estimado_total >= 0),
    moneda                  CHAR(3) NOT NULL DEFAULT 'BOB',
    condiciones             TEXT,
    estado                  VARCHAR(20) NOT NULL DEFAULT 'enviada'
                            CHECK (estado IN ('enviada', 'seleccionada', 'rechazada', 'retirada', 'expirada')),
    enviada_en              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    decidida_en             TIMESTAMPTZ,
    UNIQUE (id, solicitud_id)
);

/* ============================================================
   6. SERVICIOS, PRECIOS E HISTORIAL DE ESTADOS
   ============================================================ */

CREATE TABLE IF NOT EXISTS servicios (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    solicitud_id        BIGINT NOT NULL UNIQUE REFERENCES solicitudes_servicio(id) ON DELETE RESTRICT,
    cotizacion_id       BIGINT NOT NULL UNIQUE,
    cliente_id          BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    trabajador_id       BIGINT NOT NULL REFERENCES perfiles_trabajador(usuario_id) ON DELETE RESTRICT,
    estado              VARCHAR(25) NOT NULL DEFAULT 'en_negociacion'
                        CHECK (estado IN ('en_negociacion', 'precio_fijado', 'agendado', 'en_proceso', 'finalizado', 'cancelado')),
    fecha_visita        TIMESTAMPTZ,
    iniciado_en         TIMESTAMPTZ,
    finalizado_en       TIMESTAMPTZ,
    cancelado_en        TIMESTAMPTZ,
    cancelado_por       BIGINT REFERENCES usuarios(id) ON DELETE RESTRICT,
    motivo_cancelacion  TEXT,
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cotizacion_id, solicitud_id) REFERENCES cotizaciones(id, solicitud_id) ON DELETE RESTRICT,
    CHECK ((estado = 'finalizado' AND finalizado_en IS NOT NULL) OR estado <> 'finalizado'),
    CHECK ((estado = 'cancelado' AND cancelado_en IS NOT NULL) OR estado <> 'cancelado')
);

CREATE TABLE IF NOT EXISTS propuestas_precio (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    servicio_id         BIGINT NOT NULL REFERENCES servicios(id) ON DELETE RESTRICT,
    tipo                VARCHAR(15) NOT NULL CHECK (tipo IN ('estimado', 'fijado', 'incrementado')),
    creado_por          BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    monto_mano_obra     NUMERIC(12,2) NOT NULL CHECK (monto_mano_obra >= 0),
    monto_materiales    NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (monto_materiales >= 0),
    materiales_incluidos BOOLEAN NOT NULL DEFAULT FALSE,
    costo_transporte    NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (costo_transporte >= 0),
    recargo_urgencia    NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (recargo_urgencia >= 0),
    monto_total         NUMERIC(12,2) NOT NULL CHECK (monto_total >= 0),
    justificacion       TEXT,
    estado              VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                        CHECK (estado IN ('pendiente', 'aceptada', 'rechazada', 'reemplazada')),
    creada_en           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    decidida_por        BIGINT REFERENCES usuarios(id) ON DELETE RESTRICT,
    decidida_en         TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS historial_estados_servicio (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    servicio_id         BIGINT NOT NULL REFERENCES servicios(id) ON DELETE RESTRICT,
    estado_anterior     VARCHAR(25),
    estado_nuevo        VARCHAR(25) NOT NULL,
    cambiado_por        BIGINT REFERENCES usuarios(id) ON DELETE RESTRICT,
    observacion         TEXT,
    cambiado_en         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

/* ============================================================
   7. RESUMEN FINANCIERO Y REGISTRO DE PAGOS
   ============================================================ */

CREATE TABLE IF NOT EXISTS resumen_financiero_servicio (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    servicio_id             BIGINT NOT NULL UNIQUE REFERENCES servicios(id) ON DELETE RESTRICT,
    moneda                  CHAR(3) NOT NULL DEFAULT 'BOB',
    monto_mano_obra         NUMERIC(12,2) NOT NULL CHECK (monto_mano_obra >= 0),
    monto_materiales        NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (monto_materiales >= 0),
    costo_transporte        NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (costo_transporte >= 0),
    recargo_urgencia        NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (recargo_urgencia >= 0),
    total_acordado          NUMERIC(12,2) NOT NULL CHECK (total_acordado >= 0),
    porcentaje_anticipo     NUMERIC(5,2) NOT NULL DEFAULT 25.00 CHECK (porcentaje_anticipo = 25.00),
    monto_anticipo          NUMERIC(12,2) NOT NULL CHECK (monto_anticipo >= 0),
    porcentaje_saldo        NUMERIC(5,2) NOT NULL DEFAULT 75.00 CHECK (porcentaje_saldo = 75.00),
    monto_saldo             NUMERIC(12,2) NOT NULL CHECK (monto_saldo >= 0),
    porcentaje_comision     NUMERIC(5,2) NOT NULL DEFAULT 5.00 CHECK (porcentaje_comision = 5.00),
    monto_comision          NUMERIC(12,2) NOT NULL CHECK (monto_comision >= 0),
    calculado_en            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (monto_anticipo + monto_saldo = total_acordado)
);

CREATE TABLE IF NOT EXISTS pagos (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    servicio_id         BIGINT NOT NULL REFERENCES servicios(id) ON DELETE RESTRICT,
    tipo                VARCHAR(15) NOT NULL CHECK (tipo IN ('anticipo', 'saldo')),
    monto               NUMERIC(12,2) NOT NULL CHECK (monto >= 0),
    moneda              CHAR(3) NOT NULL DEFAULT 'BOB',
    metodo              VARCHAR(20) NOT NULL
                        CHECK (metodo IN ('qr_simulado', 'efectivo', 'qr_acordado', 'otro')),
    destino             VARCHAR(15) NOT NULL CHECK (destino IN ('plataforma', 'trabajador')),
    estado              VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                        CHECK (estado IN ('pendiente', 'reportado', 'confirmado', 'observado')),
    registrado_por      BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    registrado_en       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmado_en       TIMESTAMPTZ,
    observaciones       TEXT,
    UNIQUE (servicio_id, tipo),
    CHECK ((tipo = 'anticipo' AND destino = 'plataforma' AND metodo = 'qr_simulado')
        OR (tipo = 'saldo' AND destino = 'trabajador' AND metodo IN ('efectivo', 'qr_acordado', 'otro')))
);

CREATE TABLE IF NOT EXISTS confirmaciones_pago (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pago_id             BIGINT NOT NULL REFERENCES pagos(id) ON DELETE RESTRICT,
    usuario_id          BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    tipo_confirmacion   VARCHAR(20) NOT NULL
                        CHECK (tipo_confirmacion IN ('cliente_pago', 'trabajador_recepcion')),
    confirmado_en       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (pago_id, tipo_confirmacion)
);

CREATE TABLE IF NOT EXISTS comprobantes_pago (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pago_id             BIGINT NOT NULL REFERENCES pagos(id) ON DELETE RESTRICT,
    nombre_archivo      VARCHAR(255) NOT NULL,
    almacenamiento_key  TEXT NOT NULL,
    subido_por          BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    subido_en           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

/* Un comprobante adjunto NO confirma automáticamente el pago. */

/* ============================================================
   8. CALIFICACIONES Y EVALUACION INTERNA DE CLIENTES
   ============================================================ */

CREATE TABLE IF NOT EXISTS calificaciones_trabajador (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    servicio_id         BIGINT NOT NULL UNIQUE REFERENCES servicios(id) ON DELETE RESTRICT,
    cliente_id          BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    trabajador_id       BIGINT NOT NULL REFERENCES perfiles_trabajador(usuario_id) ON DELETE RESTRICT,
    estrellas           SMALLINT NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
    comentario          TEXT,
    creada_en           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizada_en      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS historial_calificaciones (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    calificacion_id         BIGINT NOT NULL REFERENCES calificaciones_trabajador(id) ON DELETE RESTRICT,
    estrellas_anteriores    SMALLINT NOT NULL CHECK (estrellas_anteriores BETWEEN 1 AND 5),
    comentario_anterior     TEXT,
    modificada_en           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

/* Conserva automáticamente la versión anterior cuando se actualiza una calificación. */
CREATE OR REPLACE FUNCTION guardar_historial_calificacion()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estrellas IS DISTINCT FROM NEW.estrellas
       OR OLD.comentario IS DISTINCT FROM NEW.comentario THEN
        INSERT INTO historial_calificaciones (
            calificacion_id, estrellas_anteriores, comentario_anterior
        ) VALUES (
            OLD.id, OLD.estrellas, OLD.comentario
        );
    END IF;
    NEW.actualizada_en := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_historial_calificacion ON calificaciones_trabajador;
CREATE TRIGGER trg_historial_calificacion
BEFORE UPDATE ON calificaciones_trabajador
FOR EACH ROW
EXECUTE FUNCTION guardar_historial_calificacion();

CREATE TABLE IF NOT EXISTS evaluaciones_internas_cliente (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    servicio_id         BIGINT NOT NULL UNIQUE REFERENCES servicios(id) ON DELETE RESTRICT,
    trabajador_id       BIGINT NOT NULL REFERENCES perfiles_trabajador(usuario_id) ON DELETE RESTRICT,
    cliente_id          BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    valoracion          SMALLINT CHECK (valoracion IS NULL OR valoracion BETWEEN 1 AND 5),
    tipo_incidente      VARCHAR(40),
    descripcion         TEXT NOT NULL,
    creada_en           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

/* Esta tabla contiene información interna: no debe exponerse al cliente evaluado. */

/* ============================================================
   9. RECLAMOS Y SEGUIMIENTO ADMINISTRATIVO
   ============================================================ */

CREATE TABLE IF NOT EXISTS reclamos (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    servicio_id         BIGINT NOT NULL REFERENCES servicios(id) ON DELETE RESTRICT,
    cliente_id          BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    descripcion         TEXT NOT NULL,
    tipo                VARCHAR(20) NOT NULL DEFAULT 'tecnico'
                        CHECK (tipo IN ('tecnico', 'financiero', 'otro')),
    estado              VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                        CHECK (estado IN ('pendiente', 'en_revision', 'resuelto', 'rechazado')),
    presentado_en       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    asignado_a          BIGINT REFERENCES usuarios(id) ON DELETE RESTRICT,
    resuelto_en         TIMESTAMPTZ,
    resultado           TEXT
);

CREATE TABLE IF NOT EXISTS adjuntos_reclamo (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reclamo_id          BIGINT NOT NULL REFERENCES reclamos(id) ON DELETE RESTRICT,
    nombre_archivo      VARCHAR(255) NOT NULL,
    almacenamiento_key  TEXT NOT NULL,
    subido_por          BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    subido_en           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS historial_reclamo (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reclamo_id          BIGINT NOT NULL REFERENCES reclamos(id) ON DELETE RESTRICT,
    estado_anterior     VARCHAR(20),
    estado_nuevo        VARCHAR(20) NOT NULL,
    cambiado_por        BIGINT REFERENCES usuarios(id) ON DELETE RESTRICT,
    observacion         TEXT,
    cambiado_en         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

/* ============================================================
   10. FALTAS, SUSPENSIONES Y APELACIONES
   ============================================================ */

CREATE TABLE IF NOT EXISTS incidencias_disciplinarias (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trabajador_id       BIGINT NOT NULL REFERENCES perfiles_trabajador(usuario_id) ON DELETE RESTRICT,
    servicio_id         BIGINT REFERENCES servicios(id) ON DELETE RESTRICT,
    reportada_por       BIGINT REFERENCES usuarios(id) ON DELETE RESTRICT,
    motivo              TEXT NOT NULL,
    estado              VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                        CHECK (estado IN ('pendiente', 'confirmada', 'descartada')),
    reportada_en        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revisada_por        BIGINT REFERENCES usuarios(id) ON DELETE RESTRICT,
    revisada_en         TIMESTAMPTZ,
    observaciones       TEXT
);

CREATE TABLE IF NOT EXISTS suspensiones_trabajador (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trabajador_id           BIGINT NOT NULL REFERENCES perfiles_trabajador(usuario_id) ON DELETE RESTRICT,
    incidencia_id           BIGINT NOT NULL UNIQUE REFERENCES incidencias_disciplinarias(id) ON DELETE RESTRICT,
    numero_reincidencia     INTEGER NOT NULL CHECK (numero_reincidencia >= 1),
    duracion_dias           INTEGER NOT NULL CHECK (duracion_dias > 0),
    motivo                  TEXT NOT NULL,
    inicia_en               TIMESTAMPTZ NOT NULL,
    termina_en              TIMESTAMPTZ NOT NULL,
    estado                  VARCHAR(20) NOT NULL DEFAULT 'programada'
                            CHECK (estado IN ('programada', 'activa', 'cumplida', 'revocada')),
    aplicada_por            BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    creada_en               TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (termina_en > inicia_en)
);

CREATE TABLE IF NOT EXISTS apelaciones (
    id                          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    solicitante_id              BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    solicitud_verificacion_id   BIGINT REFERENCES solicitudes_verificacion(id) ON DELETE RESTRICT,
    suspension_id               BIGINT REFERENCES suspensiones_trabajador(id) ON DELETE RESTRICT,
    motivo                      TEXT NOT NULL,
    estado                      VARCHAR(20) NOT NULL DEFAULT 'presentada'
                                CHECK (estado IN ('presentada', 'en_revision', 'aceptada', 'rechazada')),
    presentada_en               TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revisada_por                BIGINT REFERENCES usuarios(id) ON DELETE RESTRICT,
    revisada_en                 TIMESTAMPTZ,
    decision                    TEXT,
    CHECK (
        (solicitud_verificacion_id IS NOT NULL AND suspension_id IS NULL)
        OR (solicitud_verificacion_id IS NULL AND suspension_id IS NOT NULL)
    )
);

/* ============================================================
   11. PAUSAS VOLUNTARIAS DE DISPONIBILIDAD DEL TRABAJADOR
   ============================================================ */

CREATE TABLE IF NOT EXISTS pausas_disponibilidad (
    id                          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trabajador_id               BIGINT NOT NULL REFERENCES perfiles_trabajador(usuario_id) ON DELETE RESTRICT,
    iniciada_en                 TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reactivacion_prevista_en    TIMESTAMPTZ NOT NULL,
    fecha_limite_reactivacion   TIMESTAMPTZ NOT NULL,
    reactivada_en               TIMESTAMPTZ,
    CHECK (reactivacion_prevista_en > iniciada_en),
    CHECK (reactivacion_prevista_en <= iniciada_en + INTERVAL '30 days'),
    CHECK (fecha_limite_reactivacion = iniciada_en + INTERVAL '60 days'),
    CHECK (reactivada_en IS NULL OR (reactivada_en >= iniciada_en AND reactivada_en <= fecha_limite_reactivacion))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pausa_activa_trabajador
    ON pausas_disponibilidad(trabajador_id)
    WHERE reactivada_en IS NULL;

/* ============================================================
   12. ACEPTACION DE TERMINOS
   ============================================================ */

CREATE TABLE IF NOT EXISTS aceptaciones_terminos (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id          BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    version_terminos    VARCHAR(30) NOT NULL,
    aceptado_en         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_origen           INET,
    UNIQUE (usuario_id, version_terminos)
);

/* ============================================================
   13. INDICES PARA CONSULTAS FRECUENTES
   ============================================================ */

CREATE INDEX IF NOT EXISTS idx_usuarios_estado ON usuarios(estado_cuenta);
CREATE INDEX IF NOT EXISTS idx_trabajadores_zona_base ON perfiles_trabajador(zona_base_id);
CREATE INDEX IF NOT EXISTS idx_trabajadores_verificacion ON perfiles_trabajador(estado_verificacion);
CREATE INDEX IF NOT EXISTS idx_solicitudes_cliente ON solicitudes_servicio(cliente_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_categoria_zona ON solicitudes_servicio(categoria_id, zona_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado_prioridad ON solicitudes_servicio(estado, prioridad_nivel, creada_en);
CREATE INDEX IF NOT EXISTS idx_solicitudes_trabajador_destino ON solicitudes_servicio(trabajador_destino_id);
CREATE INDEX IF NOT EXISTS idx_fotos_solicitud ON fotografias_solicitud(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_solicitud ON cotizaciones(solicitud_id, estado);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_trabajador ON cotizaciones(trabajador_id, enviada_en DESC);
CREATE INDEX IF NOT EXISTS idx_servicios_cliente ON servicios(cliente_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_servicios_trabajador ON servicios(trabajador_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_historial_servicio ON historial_estados_servicio(servicio_id, cambiado_en);
CREATE INDEX IF NOT EXISTS idx_propuestas_servicio ON propuestas_precio(servicio_id, creada_en);
CREATE INDEX IF NOT EXISTS idx_pagos_servicio ON pagos(servicio_id);
CREATE INDEX IF NOT EXISTS idx_reclamos_estado ON reclamos(estado, presentado_en);
CREATE INDEX IF NOT EXISTS idx_incidencias_trabajador ON incidencias_disciplinarias(trabajador_id, reportada_en);
CREATE INDEX IF NOT EXISTS idx_suspensiones_trabajador ON suspensiones_trabajador(trabajador_id, inicia_en DESC);

/* ============================================================
   14. DATOS INICIALES: ROLES Y CATEGORIAS
   ============================================================ */

INSERT INTO roles (codigo, nombre, descripcion) VALUES
    ('CLIENTE', 'Cliente', 'Publica solicitudes, contrata servicios y califica trabajadores.'),
    ('TRABAJADOR', 'Trabajador', 'Ofrece servicios, presenta cotizaciones y gestiona trabajos.'),
    ('ADMINISTRADOR', 'Administrador', 'Gestiona verificaciones, usuarios, reclamos y configuraciones.')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO categorias (codigo, nombre, descripcion) VALUES
    ('PLOMERIA', 'Plomería', 'Servicios de plomería domiciliaria.'),
    ('ELECTRICIDAD', 'Electricidad', 'Servicios de electricidad domiciliaria.'),
    ('ALBANILERIA', 'Albañilería', 'Servicios de albañilería y construcción.'),
    ('LINEA_BLANCA', 'Línea blanca', 'Reparación de electrodomésticos y línea blanca.')
ON CONFLICT (codigo) DO NOTHING;

COMMIT;

/* ============================================================
   15. CONSULTAS DE COMPROBACION
   Ejecutar después de crear la estructura.
   ============================================================ */

-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
-- ORDER BY table_name;

-- SELECT * FROM roles ORDER BY id;
-- SELECT * FROM categorias ORDER BY id;
