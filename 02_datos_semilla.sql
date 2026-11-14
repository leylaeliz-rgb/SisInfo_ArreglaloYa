/*
    ARREGLALO YA - DATOS DE PRUEBA (SEMILLA)
    Motor: PostgreSQL

    INSTRUCCIONES:
    1. Ejecutar primero el script de estructura (tablas, roles y categorías).
    2. Conectarse a arreglalo_ya y ejecutar este archivo completo.

    Tablas pobladas:
      zonas, usuarios, usuario_roles, perfiles_trabajador,
      trabajador_categorias, trabajador_zonas_cobertura, horarios_trabajador

    NOTA: password_hash es un valor de relleno, NO un hash real.
    Para probar el login, genera hashes con bcrypt desde NestJS.
    Todos los datos son ficticios.
*/

BEGIN;

/* ============================================================
   1. ZONAS (macrodistritos y zonas de Cochabamba)
   ============================================================ */

INSERT INTO zonas (nombre, tipo, zona_padre_id) VALUES
    ('Macrodistrito Norte',  'macrodistrito', NULL),
    ('Macrodistrito Centro', 'macrodistrito', NULL),
    ('Macrodistrito Sur',    'macrodistrito', NULL);

INSERT INTO zonas (nombre, tipo, zona_padre_id)
SELECT v.nombre, 'zona', p.id
FROM (VALUES
    ('Cala Cala',     'Macrodistrito Norte'),
    ('Queru Queru',   'Macrodistrito Norte'),
    ('Sarco',         'Macrodistrito Norte'),
    ('Hipódromo',     'Macrodistrito Centro'),
    ('Muyurina',      'Macrodistrito Centro'),
    ('Jaihuayco',     'Macrodistrito Sur'),
    ('Valle Hermoso', 'Macrodistrito Sur')
) AS v(nombre, padre)
JOIN zonas p ON p.nombre = v.padre AND p.tipo = 'macrodistrito';

/* ============================================================
   2. USUARIOS (1 admin, 4 trabajadores, 3 clientes)
   ============================================================ */

INSERT INTO usuarios (nombre_completo, telefono, telefono_verificado_en, password_hash, estado_cuenta)
VALUES
    ('Administrador General', '70000001', CURRENT_TIMESTAMP, '$2b$10$PLACEHOLDER_NO_ES_UN_HASH_REAL_000000000000000000000', 'activa'),
    -- Trabajadores
    ('Carlos Mamani Quispe',  '70000011', CURRENT_TIMESTAMP, '$2b$10$PLACEHOLDER_NO_ES_UN_HASH_REAL_000000000000000000000', 'activa'),
    ('Luis Flores Rojas',     '70000012', CURRENT_TIMESTAMP, '$2b$10$PLACEHOLDER_NO_ES_UN_HASH_REAL_000000000000000000000', 'activa'),
    ('Marco Vargas Condori',  '70000013', CURRENT_TIMESTAMP, '$2b$10$PLACEHOLDER_NO_ES_UN_HASH_REAL_000000000000000000000', 'activa'),
    ('Jorge Choque Terrazas', '70000014', CURRENT_TIMESTAMP, '$2b$10$PLACEHOLDER_NO_ES_UN_HASH_REAL_000000000000000000000', 'activa'),
    -- Clientes
    ('María Fernández Soria', '70000021', CURRENT_TIMESTAMP, '$2b$10$PLACEHOLDER_NO_ES_UN_HASH_REAL_000000000000000000000', 'activa'),
    ('Ana Gutiérrez Pinto',   '70000022', CURRENT_TIMESTAMP, '$2b$10$PLACEHOLDER_NO_ES_UN_HASH_REAL_000000000000000000000', 'activa'),
    ('Pedro Salazar Arce',    '70000023', CURRENT_TIMESTAMP, '$2b$10$PLACEHOLDER_NO_ES_UN_HASH_REAL_000000000000000000000', 'activa')
ON CONFLICT (telefono) DO NOTHING;

/* ============================================================
   3. USUARIO_ROLES
   (Luis Flores tiene dos roles: ejemplo de cuenta Cliente + Trabajador)
   ============================================================ */

INSERT INTO usuario_roles (usuario_id, rol_id)
SELECT u.id, r.id
FROM (VALUES
    ('70000001', 'ADMINISTRADOR'),
    ('70000011', 'TRABAJADOR'),
    ('70000012', 'TRABAJADOR'),
    ('70000012', 'CLIENTE'),
    ('70000013', 'TRABAJADOR'),
    ('70000014', 'TRABAJADOR'),
    ('70000021', 'CLIENTE'),
    ('70000022', 'CLIENTE'),
    ('70000023', 'CLIENTE')
) AS v(telefono, rol)
JOIN usuarios u ON u.telefono = v.telefono
JOIN roles r    ON r.codigo   = v.rol
ON CONFLICT (usuario_id, rol_id) DO NOTHING;

/* ============================================================
   4. PERFILES_TRABAJADOR (todos aprobados y disponibles)
   ============================================================ */

INSERT INTO perfiles_trabajador
    (usuario_id, zona_base_id, descripcion, estado_verificacion, disponible, aprobado_en)
SELECT u.id, z.id, v.descripcion, 'aprobado', TRUE, CURRENT_TIMESTAMP
FROM (VALUES
    ('70000011', 'Cala Cala',     'Plomero con 10 años de experiencia en instalaciones y reparaciones.'),
    ('70000012', 'Hipódromo',     'Electricista domiciliario, instalaciones y tableros.'),
    ('70000013', 'Jaihuayco',     'Albañil: refacciones, revoques y pisos.'),
    ('70000014', 'Queru Queru',   'Técnico en línea blanca: lavadoras, refrigeradores y cocinas.')
) AS v(telefono, zona, descripcion)
JOIN usuarios u ON u.telefono = v.telefono
JOIN zonas z    ON z.nombre   = v.zona AND z.tipo = 'zona'
ON CONFLICT (usuario_id) DO NOTHING;

/* ============================================================
   5. TRABAJADOR_CATEGORIAS
   ============================================================ */

INSERT INTO trabajador_categorias (trabajador_id, categoria_id)
SELECT u.id, c.id
FROM (VALUES
    ('70000011', 'PLOMERIA'),
    ('70000012', 'ELECTRICIDAD'),
    ('70000012', 'LINEA_BLANCA'),
    ('70000013', 'ALBANILERIA'),
    ('70000014', 'LINEA_BLANCA')
) AS v(telefono, categoria)
JOIN usuarios u   ON u.telefono = v.telefono
JOIN categorias c ON c.codigo   = v.categoria
ON CONFLICT (trabajador_id, categoria_id) DO NOTHING;

/* ============================================================
   6. TRABAJADOR_ZONAS_COBERTURA
   ============================================================ */

INSERT INTO trabajador_zonas_cobertura (trabajador_id, zona_id)
SELECT u.id, z.id
FROM (VALUES
    ('70000011', 'Cala Cala'),
    ('70000011', 'Queru Queru'),
    ('70000011', 'Sarco'),
    ('70000012', 'Hipódromo'),
    ('70000012', 'Muyurina'),
    ('70000012', 'Cala Cala'),
    ('70000013', 'Jaihuayco'),
    ('70000013', 'Valle Hermoso'),
    ('70000014', 'Queru Queru'),
    ('70000014', 'Cala Cala'),
    ('70000014', 'Hipódromo')
) AS v(telefono, zona)
JOIN usuarios u ON u.telefono = v.telefono
JOIN zonas z    ON z.nombre   = v.zona AND z.tipo = 'zona'
ON CONFLICT (trabajador_id, zona_id) DO NOTHING;

/* ============================================================
   7. HORARIOS_TRABAJADOR
   Lunes a viernes (1-5): 08:00-12:00 y 14:00-18:00
   Sábado (6): 08:00-13:00 solo para algunos
   ============================================================ */

INSERT INTO horarios_trabajador (trabajador_id, dia_semana, hora_inicio, hora_fin)
SELECT u.id, d.dia, h.inicio, h.fin
FROM usuarios u
CROSS JOIN generate_series(1, 5) AS d(dia)
CROSS JOIN (VALUES ('08:00'::time, '12:00'::time), ('14:00'::time, '18:00'::time)) AS h(inicio, fin)
WHERE u.telefono IN ('70000011', '70000012', '70000013', '70000014')
ON CONFLICT (trabajador_id, dia_semana, hora_inicio, hora_fin) DO NOTHING;

INSERT INTO horarios_trabajador (trabajador_id, dia_semana, hora_inicio, hora_fin)
SELECT u.id, 6, '08:00', '13:00'
FROM usuarios u
WHERE u.telefono IN ('70000011', '70000013')
ON CONFLICT (trabajador_id, dia_semana, hora_inicio, hora_fin) DO NOTHING;

COMMIT;

/* ============================================================
   COMPROBACION
   ============================================================ */

-- SELECT 'zonas' t, COUNT(*) FROM zonas
-- UNION ALL SELECT 'usuarios', COUNT(*) FROM usuarios
-- UNION ALL SELECT 'usuario_roles', COUNT(*) FROM usuario_roles
-- UNION ALL SELECT 'perfiles_trabajador', COUNT(*) FROM perfiles_trabajador
-- UNION ALL SELECT 'trabajador_categorias', COUNT(*) FROM trabajador_categorias
-- UNION ALL SELECT 'trabajador_zonas_cobertura', COUNT(*) FROM trabajador_zonas_cobertura
-- UNION ALL SELECT 'horarios_trabajador', COUNT(*) FROM horarios_trabajador;
