import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ReclamosRepository } from '../core/consulta.repository';

@Injectable()
export class ReclamosTypeOrmRepository implements ReclamosRepository {
  constructor(private readonly db: DataSource) {}

  listar(usuarioId: string): Promise<Record<string, unknown>[]> {
    return this.db.query(
      `SELECT id, servicio_id, descripcion, tipo, estado, presentado_en, resultado FROM reclamos WHERE cliente_id = $1 ORDER BY id DESC LIMIT 100`,
      [usuarioId],
    );
  }
}
