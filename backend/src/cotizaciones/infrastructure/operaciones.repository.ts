import { ConflictException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OperacionesCotizacionesRepository, ResultadoCotizaciones } from '../core/operaciones.repository';

@Injectable()
export class OperacionesCotizacionesTypeOrmRepository implements OperacionesCotizacionesRepository {
  constructor(private readonly db: DataSource) {}

  async enviar(usuarioId: string, recursoId: string, manoObra: string, materiales: string, transporte: string, requiereVisita: boolean): Promise<ResultadoCotizaciones | undefined> {
    const vencidos: { nombre: string }[] = await this.db.query(
      `SELECT DISTINCT t.nombre
       FROM documentos_verificacion d
       JOIN solicitudes_verificacion v ON v.id = d.solicitud_verificacion_id
       JOIN tipos_documento_verificacion t ON t.tipo = d.tipo_documento AND t.obligatorio = TRUE
       WHERE v.trabajador_id = $1
         AND d.estado_vigencia <> 'reemplazado'
         AND (
           d.estado_vigencia = 'vencido'
           OR (d.fecha_vencimiento IS NOT NULL AND d.fecha_vencimiento < CURRENT_DATE)
           OR (d.reemplazado_por_id IS NULL AND EXISTS (
             SELECT 1 FROM documentos_verificacion ant
             WHERE ant.reemplazado_por_id = d.id
           ) AND d.estado_revision <> 'aprobado')
         )`,
      [usuarioId],
    );

    if (vencidos.length > 0) {
      const lista = vencidos.map((v) => v.nombre).join(', ');
      throw new ConflictException(
        `No puedes enviar cotizaciones porque tienes documentos obligatorios vencidos o sin aprobar tras renovación (${lista}).`,
      );
    }

    const [fila] = await this.db.query(
      `WITH solicitud AS (SELECT * FROM solicitudes_servicio WHERE id=$2 AND cliente_id<>$1 AND estado IN ('publicada','recibiendo_ofertas') FOR UPDATE)
INSERT INTO cotizaciones (solicitud_id,trabajador_id,monto_mano_obra,monto_materiales,materiales_incluidos,costo_transporte,requiere_visita,monto_estimado_total)
SELECT s.id,$1,$3,$4,$4::numeric>0,$5,$6,ROUND($3::numeric*(1+s.recargo_urgencia_pct/100)+$4::numeric+$5::numeric,2)
FROM solicitud s JOIN perfiles_trabajador p ON p.usuario_id=$1 AND p.estado_verificacion='aprobado' AND p.disponible
WHERE ($6 OR $5::numeric=0) AND (s.modalidad='publica' OR s.trabajador_destino_id=$1)
AND EXISTS (SELECT 1 FROM trabajador_categorias WHERE trabajador_id=$1 AND categoria_id=s.categoria_id)
AND EXISTS (SELECT 1 FROM trabajador_zonas_cobertura WHERE trabajador_id=$1 AND zona_id=s.zona_id)
AND NOT EXISTS (SELECT 1 FROM pausas_disponibilidad WHERE trabajador_id=$1 AND reactivada_en IS NULL)
AND NOT EXISTS (SELECT 1 FROM suspensiones_trabajador WHERE trabajador_id=$1 AND estado IN ('activa','programada') AND NOW()>=inicia_en AND NOW()<termina_en)
AND NOT EXISTS (SELECT 1 FROM cotizaciones WHERE solicitud_id=s.id AND trabajador_id=$1 AND estado='enviada')
AND NOT EXISTS (
  SELECT 1 FROM documentos_verificacion d
  JOIN solicitudes_verificacion v ON v.id = d.solicitud_verificacion_id
  JOIN tipos_documento_verificacion t ON t.tipo = d.tipo_documento AND t.obligatorio = TRUE
  WHERE v.trabajador_id = $1 AND d.estado_vigencia <> 'reemplazado'
    AND (d.estado_vigencia = 'vencido' OR (d.fecha_vencimiento IS NOT NULL AND d.fecha_vencimiento < CURRENT_DATE))
)
RETURNING id,estado,monto_estimado_total`,
      [usuarioId, recursoId, manoObra, materiales, transporte, requiereVisita],
    );
    return fila;
  }

  async retirar(usuarioId: string, recursoId: string): Promise<ResultadoCotizaciones | undefined> {
    const [fila] = await this.db.query(
      `UPDATE cotizaciones SET estado='retirada', decidida_en=NOW() WHERE trabajador_id=$1 AND id=$2 AND estado='enviada' RETURNING id,estado`,
      [usuarioId, recursoId],
    );
    return fila;
  }

  async editarCondiciones(usuarioId: string, recursoId: string, condiciones: string): Promise<ResultadoCotizaciones | undefined> {
    const [fila] = await this.db.query(
      `UPDATE cotizaciones c SET condiciones=$3 FROM solicitudes_servicio s
WHERE c.id=$2 AND c.trabajador_id=$1 AND c.estado='enviada' AND s.id=c.solicitud_id
AND s.estado IN ('publicada','recibiendo_ofertas') RETURNING c.id,c.estado,c.condiciones`,
      [usuarioId, recursoId, condiciones],
    );
    return fila;
  }
}
