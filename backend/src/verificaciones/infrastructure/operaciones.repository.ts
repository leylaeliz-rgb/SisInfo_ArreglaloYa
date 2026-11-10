import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OperacionesVerificacionesRepository, ResultadoVerificaciones } from '../core/operaciones.repository';

@Injectable()
export class OperacionesVerificacionesTypeOrmRepository implements OperacionesVerificacionesRepository {
  constructor(private readonly db: DataSource) {}

  async solicitar(usuarioId: string): Promise<ResultadoVerificaciones | undefined> {
    const [fila] = await this.db.query(
      `INSERT INTO solicitudes_verificacion (trabajador_id) SELECT usuario_id FROM perfiles_trabajador WHERE usuario_id=$1 AND estado_verificacion<>'aprobado' ON CONFLICT DO NOTHING RETURNING id,estado`,
      [usuarioId],
    );
    return fila;
  }

  async decidir(usuarioId: string, recursoId: string, estado: string, motivo: string): Promise<ResultadoVerificaciones | undefined> {
    const [fila] = await this.db.query(
      `WITH cambio AS (
 UPDATE solicitudes_verificacion v SET estado=$3,motivo_decision=$4,revisada_por=$1,revisada_en=NOW(),actualizado_en=NOW()
 WHERE v.id=$2 AND v.estado IN ('pendiente','en_revision','requiere_informacion')
 AND ($3 <> 'aprobada' OR (SELECT count(*) FROM revisiones_verificacion r WHERE r.solicitud_verificacion_id=v.id AND r.resultado='aprobado')=4)
 RETURNING id,trabajador_id,estado
), perfil AS (
 UPDATE perfiles_trabajador p SET estado_verificacion=CASE c.estado WHEN 'aprobada' THEN 'aprobado' WHEN 'rechazada' THEN 'rechazado' ELSE 'requiere_informacion' END,
 aprobado_en=CASE WHEN c.estado='aprobada' THEN NOW() ELSE NULL END,
 disponible=FALSE,actualizado_en=NOW() FROM cambio c WHERE p.usuario_id=c.trabajador_id
) SELECT id,estado FROM cambio`,
      [usuarioId, recursoId, estado, motivo],
    );
    return fila;
  }

  async retirarSolicitud(usuarioId: string, recursoId: string): Promise<ResultadoVerificaciones | undefined> {
    const [fila] = await this.db.query(
      `DELETE FROM solicitudes_verificacion v WHERE id=$2 AND trabajador_id=$1 AND estado='pendiente'
AND NOT EXISTS (SELECT 1 FROM documentos_verificacion WHERE solicitud_verificacion_id=v.id)
AND NOT EXISTS (SELECT 1 FROM revisiones_verificacion WHERE solicitud_verificacion_id=v.id)
AND NOT EXISTS (SELECT 1 FROM apelaciones WHERE solicitud_verificacion_id=v.id)
RETURNING id,estado`,
      [usuarioId, recursoId],
    );
    return fila;
  }

  async registrarCriterio(usuarioId: string, recursoId: string, criterio: string, estado: string, observaciones: string): Promise<ResultadoVerificaciones | undefined> {
    const [fila] = await this.db.query(
      `WITH elegible AS (
 SELECT v.id FROM solicitudes_verificacion v WHERE v.id=$2 AND v.estado IN ('pendiente','en_revision','requiere_informacion')
 AND ($4::varchar <> 'aprobado' OR EXISTS (
  SELECT 1 FROM documentos_verificacion d JOIN archivos_verificacion a ON a.documento_id=d.id
  WHERE d.solicitud_verificacion_id=v.id AND d.tipo_documento=CASE WHEN $3::varchar='reputacion' THEN 'referencias_reputacion' ELSE $3::varchar END
 )) FOR UPDATE OF v
)
INSERT INTO revisiones_verificacion (solicitud_verificacion_id,criterio,resultado,observaciones,revisado_por,revisado_en)
SELECT id,$3,$4,$5,$1,NOW() FROM elegible
ON CONFLICT (solicitud_verificacion_id,criterio) DO UPDATE SET resultado=EXCLUDED.resultado,
observaciones=EXCLUDED.observaciones,revisado_por=EXCLUDED.revisado_por,revisado_en=EXCLUDED.revisado_en RETURNING id,criterio,resultado`,
      [usuarioId, recursoId, criterio, estado, observaciones],
    );
    return fila;
  }
}
