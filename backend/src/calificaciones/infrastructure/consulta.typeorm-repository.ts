import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CalificacionesRepository } from '../core/consulta.repository';

@Injectable()
export class CalificacionesTypeOrmRepository implements CalificacionesRepository {
  constructor(private readonly db: DataSource) {}

  listar(usuarioId: string): Promise<Record<string, unknown>[]> {
    return this.db.query(
      `SELECT id, servicio_id, estrellas, comentario, actualizada_en FROM calificaciones_trabajador WHERE retirada_en IS NULL AND (cliente_id = $1 OR trabajador_id = $1) ORDER BY id DESC LIMIT 100`,
      [usuarioId],
    );
  }
}
