import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OperacionesSolicitudesRepository, ResultadoSolicitudes } from '../core/operaciones.repository';

@Injectable()
export class OperacionesSolicitudesTypeOrmRepository implements OperacionesSolicitudesRepository {
  constructor(private readonly db: DataSource) {}

  async publicar(usuarioId: string, categoriaId: string, zonaId: string, titulo: string, descripcion: string, urgente: boolean): Promise<ResultadoSolicitudes | undefined> {
    const [fila] = await this.db.query(
      `INSERT INTO solicitudes_servicio (cliente_id,categoria_id,zona_id,modalidad,titulo,descripcion,urgente,recargo_urgencia_pct) SELECT $1,c.id,z.id,'publica',$4,$5,$6,CASE WHEN $6 THEN 10 ELSE 0 END FROM categorias c CROSS JOIN zonas z WHERE c.id=$2 AND c.activa AND z.id=$3 AND z.activa RETURNING id, titulo, estado`,
      [usuarioId, categoriaId, zonaId, titulo, descripcion, urgente],
    );
    return fila;
  }

  async editar(usuarioId: string, recursoId: string, titulo: string, descripcion: string): Promise<ResultadoSolicitudes | undefined> {
    const [fila] = await this.db.query(
      `UPDATE solicitudes_servicio SET titulo=$3, descripcion=$4, actualizada_en=NOW() WHERE cliente_id=$1 AND id=$2 AND estado='publicada' AND NOT EXISTS (SELECT 1 FROM cotizaciones WHERE solicitud_id=$2) RETURNING id,titulo,descripcion,estado`,
      [usuarioId, recursoId, titulo, descripcion],
    );
    return fila;
  }

  async cancelar(usuarioId: string, recursoId: string, motivo: string): Promise<ResultadoSolicitudes | undefined> {
    const [fila] = await this.db.query(
      `UPDATE solicitudes_servicio SET estado='cancelada', cancelada_por=$1, motivo_cancelacion=$3, cancelada_en=NOW(), actualizada_en=NOW() WHERE cliente_id=$1 AND id=$2 AND estado IN ('publicada','recibiendo_ofertas') RETURNING id,estado`,
      [usuarioId, recursoId, motivo],
    );
    return fila;
  }
}
