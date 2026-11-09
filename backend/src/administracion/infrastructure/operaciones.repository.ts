import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OperacionesAdministracionRepository, ResultadoAdministracion } from '../core/operaciones.repository';

@Injectable()
export class OperacionesAdministracionTypeOrmRepository implements OperacionesAdministracionRepository {
  constructor(private readonly db: DataSource) {}

  async revocarSuspension(usuarioId: string, recursoId: string): Promise<ResultadoAdministracion | undefined> {
    const [fila] = await this.db.query(
      `UPDATE suspensiones_trabajador SET estado='revocada' WHERE id=$2 AND $1::bigint IS NOT NULL AND estado IN ('activa','programada') RETURNING id,estado`,
      [usuarioId, recursoId],
    );
    return fila;
  }
}
