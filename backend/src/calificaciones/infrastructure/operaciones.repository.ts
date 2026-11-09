import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OperacionesCalificacionesRepository, ResultadoCalificaciones } from '../core/operaciones.repository';

@Injectable()
export class OperacionesCalificacionesTypeOrmRepository implements OperacionesCalificacionesRepository {
  constructor(private readonly db: DataSource) {}

  async guardar(usuarioId: string, recursoId: string, estrellas: number, comentario: string): Promise<ResultadoCalificaciones | undefined> {
    const [fila] = await this.db.query(
      `INSERT INTO calificaciones_trabajador (servicio_id,cliente_id,trabajador_id,estrellas,comentario) SELECT id,cliente_id,trabajador_id,$3,$4 FROM servicios WHERE cliente_id=$1 AND id=$2 AND estado='finalizado' ON CONFLICT (servicio_id) DO UPDATE SET estrellas=EXCLUDED.estrellas, comentario=EXCLUDED.comentario, actualizada_en=NOW() WHERE calificaciones_trabajador.cliente_id=$1 RETURNING id,servicio_id,estrellas,comentario`,
      [usuarioId, recursoId, estrellas, comentario],
    );
    return fila;
  }
}
