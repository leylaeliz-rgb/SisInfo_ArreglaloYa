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
 SELECT id,ROUND(($3::numeric+$4::numeric)*recargo_urgencia_pct/100,2) AS recargo FROM elegible
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
}
