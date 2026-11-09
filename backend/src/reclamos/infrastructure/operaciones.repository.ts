import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OperacionesReclamosRepository, ResultadoReclamos } from '../core/operaciones.repository';

@Injectable()
export class OperacionesReclamosTypeOrmRepository implements OperacionesReclamosRepository {
  constructor(private readonly db: DataSource) {}

  async presentar(usuarioId: string, recursoId: string, descripcion: string, tipo: string): Promise<ResultadoReclamos | undefined> {
    const [fila] = await this.db.query(
      `WITH nuevo AS (INSERT INTO reclamos (servicio_id,cliente_id,descripcion,tipo) SELECT id,cliente_id,$3,$4 FROM servicios WHERE cliente_id=$1 AND id=$2 AND estado='finalizado' AND NOW() <= finalizado_en + INTERVAL '7 days' RETURNING id,estado), historial AS (INSERT INTO historial_reclamo (reclamo_id,estado_nuevo,cambiado_por) SELECT id,estado,$1 FROM nuevo) SELECT * FROM nuevo`,
      [usuarioId, recursoId, descripcion, tipo],
    );
    return fila;
  }

  async resolver(usuarioId: string, recursoId: string, estado: string, resultado: string): Promise<ResultadoReclamos | undefined> {
    const [fila] = await this.db.query(
      `WITH previo AS (SELECT id,estado FROM reclamos WHERE id=$2 AND estado IN ('pendiente','en_revision') FOR UPDATE), cambio AS (UPDATE reclamos r SET estado=$3, resultado=$4, resuelto_en=NOW(), asignado_a=$1 FROM previo p WHERE r.id=p.id RETURNING r.id,r.estado,p.estado AS anterior), historial AS (INSERT INTO historial_reclamo (reclamo_id,estado_anterior,estado_nuevo,cambiado_por,observacion) SELECT id,anterior,estado,$1,$4 FROM cambio) SELECT id,estado FROM cambio`,
      [usuarioId, recursoId, estado, resultado],
    );
    return fila;
  }
}
