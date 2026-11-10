import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OperacionesServiciosRepository, ResultadoServicios } from '../core/operaciones.repository';

@Injectable()
export class OperacionesServiciosTypeOrmRepository implements OperacionesServiciosRepository {
  constructor(private readonly db: DataSource) {}

  async contratar(usuarioId: string, recursoId: string): Promise<ResultadoServicios | undefined> {
    const [fila] = await this.db.query(
      `WITH oferta AS (
 SELECT c.id,c.solicitud_id,c.trabajador_id,s.cliente_id FROM cotizaciones c
 JOIN solicitudes_servicio s ON s.id=c.solicitud_id
 JOIN perfiles_trabajador p ON p.usuario_id=c.trabajador_id
 WHERE c.id=$2 AND s.cliente_id=$1 AND s.estado IN ('publicada','recibiendo_ofertas') AND c.estado='enviada'
 AND p.estado_verificacion='aprobado'
 FOR UPDATE OF s,c
), nuevo AS (
 INSERT INTO servicios (solicitud_id,cotizacion_id,cliente_id,trabajador_id)
 SELECT solicitud_id,id,cliente_id,trabajador_id FROM oferta ON CONFLICT DO NOTHING RETURNING *
), seleccion AS (
 UPDATE cotizaciones c SET estado=CASE WHEN c.id=n.cotizacion_id THEN 'seleccionada' ELSE 'rechazada' END,decidida_en=NOW()
 FROM nuevo n WHERE c.solicitud_id=n.solicitud_id AND c.estado='enviada'
), solicitud AS (
 UPDATE solicitudes_servicio s SET estado='contratada',actualizada_en=NOW() FROM nuevo n WHERE s.id=n.solicitud_id
), historial AS (
 INSERT INTO historial_estados_servicio (servicio_id,estado_nuevo,cambiado_por) SELECT id,estado,$1 FROM nuevo
) SELECT id,estado FROM nuevo`,
      [usuarioId, recursoId],
    );
    return fila;
  }

  async finalizar(usuarioId: string, recursoId: string): Promise<ResultadoServicios | undefined> {
    const [fila] = await this.db.query(
      `WITH cambio AS (UPDATE servicios SET estado='finalizado', finalizado_en=NOW(), actualizado_en=NOW() WHERE id=$2 AND trabajador_id=$1 AND estado='en_proceso' AND NOT EXISTS (SELECT 1 FROM propuestas_precio WHERE servicio_id=$2 AND estado='pendiente') RETURNING id,estado), historial AS (INSERT INTO historial_estados_servicio (servicio_id,estado_anterior,estado_nuevo,cambiado_por) SELECT id,'en_proceso',estado,$1 FROM cambio) SELECT * FROM cambio`,
      [usuarioId, recursoId],
    );
    return fila;
  }

  async proponerPrecio(usuarioId: string, recursoId: string, manoObra: string, materiales: string, transporte: string): Promise<ResultadoServicios | undefined> {
    const [fila] = await this.db.query(
      `WITH elegible AS (
 SELECT s.id, sol.recargo_urgencia_pct, c.requiere_visita
 FROM servicios s JOIN solicitudes_servicio sol ON sol.id=s.solicitud_id
 JOIN cotizaciones c ON c.id=s.cotizacion_id
 WHERE s.id=$2 AND s.trabajador_id=$1 AND s.estado='en_negociacion' FOR UPDATE OF s
), importes AS (
 SELECT id,ROUND($3::numeric*recargo_urgencia_pct/100,2) AS recargo FROM elegible
 WHERE (requiere_visita OR $5::numeric=0) AND NOT EXISTS (
 SELECT 1 FROM propuestas_precio WHERE servicio_id=$2 AND estado='pendiente')
)
INSERT INTO propuestas_precio (servicio_id,tipo,creado_por,monto_mano_obra,monto_materiales,materiales_incluidos,costo_transporte,recargo_urgencia,monto_total)
SELECT id,'fijado',$1,$3,$4,$4::numeric>0,$5,recargo,$3::numeric+$4::numeric+$5::numeric+recargo FROM importes
RETURNING id,estado,monto_total`,
      [usuarioId, recursoId, manoObra, materiales, transporte],
    );
    return fila;
  }

  async aceptarPrecio(usuarioId: string, recursoId: string, propuestaId: string): Promise<ResultadoServicios | undefined> {
    const [fila] = await this.db.query(
      `WITH elegible AS (
 SELECT id FROM servicios WHERE id=$2 AND cliente_id=$1 AND estado='en_negociacion' FOR UPDATE
), precio AS (
 UPDATE propuestas_precio p SET estado='aceptada',decidida_por=$1,decidida_en=NOW() FROM elegible s
 WHERE p.id=$3 AND p.servicio_id=s.id AND p.tipo='fijado' AND p.estado='pendiente' RETURNING p.*
), cambio AS (
 UPDATE servicios s SET estado='precio_fijado',actualizado_en=NOW() FROM precio p WHERE s.id=p.servicio_id RETURNING s.id,s.estado
), resumen AS (
 INSERT INTO resumen_financiero_servicio (servicio_id,monto_mano_obra,monto_materiales,costo_transporte,recargo_urgencia,total_acordado,monto_anticipo,monto_saldo,monto_comision)
 SELECT servicio_id,monto_mano_obra,monto_materiales,costo_transporte,recargo_urgencia,monto_total,
 ROUND(monto_total*0.25,2),monto_total-ROUND(monto_total*0.25,2),ROUND(monto_total*0.05,2) FROM precio
), historial AS (
 INSERT INTO historial_estados_servicio (servicio_id,estado_anterior,estado_nuevo,cambiado_por)
 SELECT id,'en_negociacion',estado,$1 FROM cambio
) SELECT * FROM cambio`,
      [usuarioId, recursoId, propuestaId],
    );
    return fila;
  }

  async iniciar(usuarioId: string, recursoId: string): Promise<ResultadoServicios | undefined> {
    const [fila] = await this.db.query(
      `WITH previo AS (
 SELECT id,estado FROM servicios WHERE id=$2 AND trabajador_id=$1 AND estado IN ('precio_fijado','agendado') FOR UPDATE
), cambio AS (
 UPDATE servicios s SET estado='en_proceso',iniciado_en=NOW(),actualizado_en=NOW() FROM previo p
 WHERE s.id=p.id AND EXISTS (SELECT 1 FROM pagos WHERE servicio_id=p.id AND tipo='anticipo' AND estado='confirmado' AND metodo='qr_simulado')
 RETURNING s.id,s.estado,p.estado AS anterior
), historial AS (
 INSERT INTO historial_estados_servicio (servicio_id,estado_anterior,estado_nuevo,cambiado_por)
 SELECT id,anterior,estado,$1 FROM cambio
) SELECT id,estado FROM cambio`,
      [usuarioId, recursoId],
    );
    return fila;
  }

  async cancelarAntesDeIniciar(usuarioId: string, recursoId: string): Promise<ResultadoServicios | undefined> {
    const [fila] = await this.db.query(
      `WITH previo AS (
SELECT id,estado,solicitud_id FROM servicios WHERE id=$2 AND cliente_id=$1
AND estado IN ('en_negociacion','precio_fijado','agendado') FOR UPDATE
), cambio AS (
UPDATE servicios s SET estado='cancelado',cancelado_en=NOW(),cancelado_por=$1,
motivo_cancelacion='Cancelado por el cliente antes de iniciar',actualizado_en=NOW()
FROM previo p WHERE s.id=p.id
RETURNING s.id,s.estado,p.estado AS anterior,s.solicitud_id,s.fecha_visita
), solicitud AS (
UPDATE solicitudes_servicio s SET estado='cancelada',cancelada_por=$1,cancelada_en=NOW(),
motivo_cancelacion='Servicio cancelado antes de iniciar',actualizada_en=NOW()
FROM cambio c WHERE s.id=c.solicitud_id
), reversion AS (
 INSERT INTO reversiones_pago_simulado (pago_id,registrada_por,motivo)
 SELECT p.id,$1,'Cancelación anticipada del cliente'
 FROM cambio c JOIN pagos p ON p.servicio_id=c.id
 WHERE p.tipo='anticipo' AND p.metodo='qr_simulado' AND p.estado='confirmado'
 AND c.fecha_visita>=NOW()+INTERVAL '2 hours'
 ON CONFLICT (pago_id) DO NOTHING
), historial AS (
INSERT INTO historial_estados_servicio (servicio_id,estado_anterior,estado_nuevo,cambiado_por)
SELECT id,anterior,estado,$1 FROM cambio
) SELECT id,estado FROM cambio`,
      [usuarioId, recursoId],
    );
    return fila;
  }

  async agendar(usuarioId: string, recursoId: string, fecha: string): Promise<ResultadoServicios | undefined> {
    const [fila] = await this.db.query(
      `WITH previo AS (
 SELECT id,estado FROM servicios WHERE cliente_id=$1 AND id=$2 AND estado IN ('precio_fijado','agendado')
 AND $3::timestamptz>NOW() AND (fecha_visita IS NULL OR fecha_visita>=NOW()+INTERVAL '2 hours') FOR UPDATE
), cambio AS (
 UPDATE servicios s SET estado='agendado',fecha_visita=$3::timestamptz,actualizado_en=NOW()
 FROM previo p WHERE s.id=p.id RETURNING s.id,s.estado,s.fecha_visita,p.estado AS anterior
), historial AS (
 INSERT INTO historial_estados_servicio (servicio_id,estado_anterior,estado_nuevo,cambiado_por,observacion)
 SELECT id,anterior,estado,$1,'Visita programada' FROM cambio
) SELECT id,estado,fecha_visita FROM cambio`,
      [usuarioId, recursoId, fecha],
    );
    return fila;
  }

  async contacto(usuarioId: string, recursoId: string): Promise<ResultadoServicios | undefined> {
    const [fila] = await this.db.query(
      `SELECT 'https://wa.me/' || CASE WHEN length(u.telefono)=8 THEN '591'||u.telefono ELSE substring(u.telefono FROM 2) END AS enlace
       FROM servicios s JOIN usuarios u ON u.id=CASE WHEN s.cliente_id=$1 THEN s.trabajador_id ELSE s.cliente_id END
       WHERE s.id=$2 AND (s.cliente_id=$1 OR s.trabajador_id=$1)
       AND s.estado IN ('precio_fijado','agendado','en_proceso','finalizado')
       AND EXISTS (SELECT 1 FROM pagos WHERE servicio_id=s.id AND tipo='anticipo' AND estado='confirmado')
       AND (u.telefono ~ '^[0-9]{8}$' OR u.telefono ~ '^[+][1-9][0-9]{7,14}$')`,
      [usuarioId, recursoId],
    );
    return fila;
  }

  async rechazarPrecio(usuarioId: string, recursoId: string, propuestaId: string): Promise<ResultadoServicios | undefined> {
    const [fila] = await this.db.query(
      `WITH previo AS (
 SELECT id,estado,solicitud_id FROM servicios WHERE id=$2 AND cliente_id=$1 AND estado IN ('en_negociacion','en_proceso') FOR UPDATE
), rechazo AS (
 UPDATE propuestas_precio p SET estado='rechazada',decidida_por=$1,decidida_en=NOW() FROM previo s
 WHERE p.id=$3 AND p.servicio_id=s.id AND p.estado='pendiente'
 AND ((s.estado='en_negociacion' AND p.tipo='fijado') OR (s.estado='en_proceso' AND p.tipo='incrementado'))
 RETURNING p.servicio_id
), cambio AS (
 UPDATE servicios s SET estado='cancelado',cancelado_por=$1,cancelado_en=NOW(),motivo_cancelacion='Precio rechazado',actualizado_en=NOW()
 FROM previo p JOIN rechazo r ON r.servicio_id=p.id WHERE s.id=p.id
 RETURNING s.id,s.estado,p.estado AS anterior,s.solicitud_id
), solicitud AS (
 UPDATE solicitudes_servicio s SET estado='cancelada',cancelada_por=$1,cancelada_en=NOW(),
 motivo_cancelacion='Precio rechazado',actualizada_en=NOW() FROM cambio c WHERE s.id=c.solicitud_id
), historial AS (
 INSERT INTO historial_estados_servicio (servicio_id,estado_anterior,estado_nuevo,cambiado_por,observacion)
 SELECT id,anterior,estado,$1,'Precio rechazado' FROM cambio
) SELECT id,estado FROM cambio`,
      [usuarioId, recursoId, propuestaId],
    );
    return fila;
  }

  async proponerIncremento(usuarioId: string, recursoId: string, manoObra: string, materiales: string, justificacion: string): Promise<ResultadoServicios | undefined> {
    const [fila] = await this.db.query(
      `WITH previo AS (
 SELECT s.id,r.monto_mano_obra,r.monto_materiales,r.costo_transporte,r.recargo_urgencia,r.total_acordado,q.recargo_urgencia_pct
 FROM servicios s JOIN resumen_financiero_servicio r ON r.servicio_id=s.id JOIN solicitudes_servicio q ON q.id=s.solicitud_id
 WHERE s.id=$2 AND s.trabajador_id=$1 AND s.estado='en_proceso' FOR UPDATE OF s
), importes AS (
 SELECT *, ROUND($3::numeric*recargo_urgencia_pct/100,2) AS recargo
 FROM previo WHERE $3::numeric+$4::numeric>monto_mano_obra+monto_materiales
 AND NOT EXISTS (SELECT 1 FROM propuestas_precio WHERE servicio_id=$2 AND estado='pendiente')
)
INSERT INTO propuestas_precio (servicio_id,tipo,creado_por,monto_mano_obra,monto_materiales,materiales_incluidos,costo_transporte,recargo_urgencia,monto_total,justificacion)
SELECT id,'incrementado',$1,$3,$4,$4::numeric>0,costo_transporte,recargo,$3::numeric+$4::numeric+costo_transporte+recargo,$5
FROM importes WHERE $3::numeric+$4::numeric+costo_transporte+recargo>total_acordado RETURNING id,estado,monto_total`,
      [usuarioId, recursoId, manoObra, materiales, justificacion],
    );
    return fila;
  }

  async aceptarIncremento(usuarioId: string, recursoId: string, propuestaId: string): Promise<ResultadoServicios | undefined> {
    const [fila] = await this.db.query(
      `WITH previo AS (
 SELECT id FROM servicios WHERE id=$2 AND cliente_id=$1 AND estado='en_proceso' FOR UPDATE
), precio AS (
 UPDATE propuestas_precio p SET estado='aceptada',decidida_por=$1,decidida_en=NOW() FROM previo s
 WHERE p.id=$3 AND p.servicio_id=s.id AND p.tipo='incrementado' AND p.estado='pendiente' RETURNING p.*
), resumen AS (
 UPDATE resumen_financiero_servicio r SET monto_mano_obra=p.monto_mano_obra,monto_materiales=p.monto_materiales,
 costo_transporte=p.costo_transporte,recargo_urgencia=p.recargo_urgencia,total_acordado=p.monto_total,
 monto_saldo=p.monto_total-r.monto_anticipo,monto_comision=ROUND(p.monto_total*0.05,2),calculado_en=NOW()
 FROM precio p WHERE r.servicio_id=p.servicio_id RETURNING r.servicio_id,r.total_acordado,r.monto_saldo
) SELECT * FROM resumen`,
      [usuarioId, recursoId, propuestaId],
    );
    return fila;
  }

  async cancelarPorTrabajador(usuarioId: string, recursoId: string, motivo: string): Promise<ResultadoServicios | undefined> {
    const [fila] = await this.db.query(
      `WITH previo AS (
 SELECT id,estado,solicitud_id,fecha_visita FROM servicios WHERE id=$2 AND trabajador_id=$1
 AND estado IN ('en_negociacion','precio_fijado','agendado') FOR UPDATE
), cambio AS (
 UPDATE servicios s SET estado='cancelado',cancelado_en=NOW(),cancelado_por=$1,
 motivo_cancelacion=$3,actualizado_en=NOW()
 FROM previo p WHERE s.id=p.id
 RETURNING s.id,s.estado,p.estado AS anterior,s.solicitud_id,p.fecha_visita
), solicitud AS (
 UPDATE solicitudes_servicio s SET estado='cancelada',cancelada_por=$1,cancelada_en=NOW(),
 motivo_cancelacion=$3,actualizada_en=NOW() FROM cambio c WHERE s.id=c.solicitud_id
), historial AS (
 INSERT INTO historial_estados_servicio (servicio_id,estado_anterior,estado_nuevo,cambiado_por,observacion)
 SELECT id,anterior,estado,$1,$3 FROM cambio
), incidencia AS (
 INSERT INTO incidencias_disciplinarias (trabajador_id,servicio_id,reportada_por,motivo)
 SELECT $1,id,$1,'Cancelación del trabajador con menos de dos horas de anticipación'
 FROM cambio WHERE fecha_visita IS NOT NULL AND fecha_visita<NOW()+INTERVAL '2 hours'
) SELECT id,estado FROM cambio`,
      [usuarioId, recursoId, motivo],
    );
    return fila;
  }
}
