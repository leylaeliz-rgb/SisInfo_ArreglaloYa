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
}
