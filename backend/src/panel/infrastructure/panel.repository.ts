import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConsultaPanel, PanelRepository } from '../core/panel.repository';

const consultas: Record<ConsultaPanel, string> = {
  categorias: `SELECT id,codigo,nombre,descripcion,activa FROM categorias WHERE $1::bigint IS NOT NULL ORDER BY nombre`,
  zonas: `SELECT id,nombre,tipo,zona_padre_id AS "zonaPadreId",activa FROM zonas WHERE $1::bigint IS NOT NULL ORDER BY nombre`,
  profesionales: `SELECT p.usuario_id AS id,u.nombre_completo FROM perfiles_trabajador p
    JOIN usuarios u ON u.id=p.usuario_id WHERE $1::bigint IS NOT NULL ORDER BY u.nombre_completo LIMIT 500`,
  resumen: `SELECT
    (SELECT count(*)::int FROM usuarios WHERE estado_cuenta='activa' AND ($2::date IS NULL OR creado_en >= $2::date) AND ($3::date IS NULL OR creado_en < $3::date + INTERVAL '1 day')) AS usuarios,
    (SELECT count(*)::int FROM perfiles_trabajador WHERE estado_verificacion='aprobado' AND ($2::date IS NULL OR creado_en >= $2::date) AND ($3::date IS NULL OR creado_en < $3::date + INTERVAL '1 day')) AS trabajadores_aprobados,
    (SELECT count(*)::int FROM solicitudes_servicio WHERE estado IN ('publicada','recibiendo_ofertas') AND ($2::date IS NULL OR creada_en >= $2::date) AND ($3::date IS NULL OR creada_en < $3::date + INTERVAL '1 day')) AS solicitudes_abiertas,
    (SELECT count(*)::int FROM servicios WHERE estado NOT IN ('finalizado','cancelado') AND ($2::date IS NULL OR creado_en >= $2::date) AND ($3::date IS NULL OR creado_en < $3::date + INTERVAL '1 day')) AS servicios_activos,
    (SELECT count(*)::int FROM reclamos WHERE estado IN ('pendiente','en_revision') AND ($2::date IS NULL OR presentado_en >= $2::date) AND ($3::date IS NULL OR presentado_en < $3::date + INTERVAL '1 day')) AS reclamos_pendientes,
    (SELECT count(*)::int FROM solicitudes_verificacion WHERE estado IN ('pendiente','en_revision','requiere_informacion') AND ($2::date IS NULL OR enviada_en >= $2::date) AND ($3::date IS NULL OR enviada_en < $3::date + INTERVAL '1 day')) AS verificaciones_pendientes
    WHERE $1::bigint IS NOT NULL`,
  trabajador: `SELECT p.usuario_id AS id,p.descripcion,p.zona_base_id,p.disponible,p.estado_verificacion,
ARRAY(SELECT categoria_id::text FROM trabajador_categorias WHERE trabajador_id=p.usuario_id) AS categorias,
ARRAY(SELECT zona_id::text FROM trabajador_zonas_cobertura WHERE trabajador_id=p.usuario_id) AS zonas,
COALESCE((SELECT json_agg(json_build_object('dia',dia_semana,'inicio',to_char(hora_inicio,'HH24:MI'),'fin',to_char(hora_fin,'HH24:MI'))) FROM horarios_trabajador WHERE trabajador_id=p.usuario_id AND activo),'[]') AS franjas
FROM perfiles_trabajador p WHERE p.usuario_id=$1`,
  servicios: `SELECT s.id,s.estado,s.cliente_id,s.trabajador_id,s.fecha_visita,q.titulo,
uc.nombre_completo AS cliente,ut.nombre_completo AS trabajador,
r.total_acordado,r.monto_anticipo,r.monto_saldo,r.monto_comision,
COALESCE((SELECT json_agg(json_build_object('id',p.id::text,'tipo',p.tipo,'estado',p.estado,'total',p.monto_total,'justificacion',p.justificacion) ORDER BY p.id) FROM propuestas_precio p WHERE p.servicio_id=s.id),'[]') AS precios,
COALESCE((SELECT json_agg(json_build_object('id',p.id::text,'tipo',p.tipo,'estado',CASE WHEN EXISTS(SELECT 1 FROM reversiones_pago_simulado v WHERE v.pago_id=p.id) THEN 'revertido' ELSE p.estado END,'monto',p.monto,'metodo',p.metodo)) FROM pagos p WHERE p.servicio_id=s.id),'[]') AS pagos
FROM servicios s JOIN solicitudes_servicio q ON q.id=s.solicitud_id JOIN usuarios uc ON uc.id=s.cliente_id JOIN usuarios ut ON ut.id=s.trabajador_id
LEFT JOIN resumen_financiero_servicio r ON r.servicio_id=s.id
WHERE (($2='cliente' AND s.cliente_id=$1) OR ($2='trabajador' AND s.trabajador_id=$1)) ORDER BY s.id DESC LIMIT 100`,
  cotizaciones: `SELECT c.id,c.solicitud_id,c.trabajador_id,c.monto_estimado_total,c.estado,c.moneda,c.condiciones,
s.titulo,s.estado AS estado_solicitud,s.cliente_id,u.nombre_completo AS trabajador
FROM cotizaciones c JOIN solicitudes_servicio s ON s.id=c.solicitud_id JOIN usuarios u ON u.id=c.trabajador_id
WHERE (($2='cliente' AND s.cliente_id=$1) OR ($2='trabajador' AND c.trabajador_id=$1)) ORDER BY c.id DESC LIMIT 100`,
  trabajadores: `SELECT p.usuario_id AS id,p.descripcion,p.zona_base_id,z.nombre AS zona,u.nombre_completo,
COALESCE((SELECT json_agg(c.nombre) FROM trabajador_categorias tc JOIN categorias c ON c.id=tc.categoria_id WHERE tc.trabajador_id=p.usuario_id),'[]') AS especialidades
FROM perfiles_trabajador p JOIN usuarios u ON u.id=p.usuario_id JOIN zonas z ON z.id=p.zona_base_id
WHERE u.estado_cuenta='activa' AND p.estado_verificacion='aprobado' AND p.disponible AND p.usuario_id<>$1
AND NOT EXISTS(SELECT 1 FROM pausas_disponibilidad WHERE trabajador_id=p.usuario_id AND reactivada_en IS NULL)
AND NOT EXISTS(SELECT 1 FROM suspensiones_trabajador WHERE trabajador_id=p.usuario_id AND estado IN ('activa','programada') AND NOW() BETWEEN inicia_en AND termina_en)
ORDER BY u.nombre_completo LIMIT 100`,
  apelaciones: `SELECT a.id,a.estado,a.motivo,a.decision,a.suspension_id,a.solicitud_verificacion_id,u.nombre_completo
FROM apelaciones a JOIN usuarios u ON u.id=a.solicitante_id WHERE a.solicitante_id=$1 OR $2::boolean ORDER BY a.id DESC LIMIT 100`,
  reclamos: `SELECT r.id,r.servicio_id,r.descripcion,r.tipo,r.estado,r.resultado,s.titulo,u.nombre_completo AS cliente
FROM reclamos r JOIN servicios v ON v.id=r.servicio_id JOIN solicitudes_servicio s ON s.id=v.solicitud_id JOIN usuarios u ON u.id=r.cliente_id
WHERE $2='administrador' OR ($2='cliente' AND r.cliente_id=$1) OR ($2='trabajador' AND v.trabajador_id=$1)
ORDER BY r.id DESC LIMIT 100`,
  suspensiones: `SELECT id,estado,motivo,duracion_dias,inicia_en,termina_en,trabajador_id FROM suspensiones_trabajador WHERE trabajador_id=$1 ORDER BY id DESC LIMIT 100`,
  verificaciones: `SELECT v.id,v.estado,v.motivo_decision,u.nombre_completo,
COALESCE((SELECT json_agg(json_build_object('id',d.id::text,'tipo',d.tipo_documento,'nombre',d.nombre_archivo)) FROM documentos_verificacion d WHERE d.solicitud_verificacion_id=v.id),'[]') AS documentos,
COALESCE((SELECT json_agg(json_build_object('criterio',r.criterio,'resultado',r.resultado,'observaciones',r.observaciones)) FROM revisiones_verificacion r WHERE r.solicitud_verificacion_id=v.id),'[]') AS criterios
FROM solicitudes_verificacion v JOIN usuarios u ON u.id=v.trabajador_id WHERE v.trabajador_id=$1 OR $2::boolean ORDER BY v.id DESC LIMIT 100`,
};

@Injectable()
export class PanelTypeOrmRepository implements PanelRepository {
  constructor(private readonly db: DataSource) {}

  consultar(consulta: ConsultaPanel, usuarioId: string, administrador: boolean, rol: string, desde?: string, hasta?: string) {
    const parametros = consulta === 'resumen' ? [usuarioId, desde ?? null, hasta ?? null] :
      consulta === 'servicios' || consulta === 'cotizaciones' || consulta === 'reclamos' ? [usuarioId, rol] :
      consultas[consulta].includes('$2') ? [usuarioId, administrador] : [usuarioId];
    return this.db.query(consultas[consulta], parametros);
  }
}
