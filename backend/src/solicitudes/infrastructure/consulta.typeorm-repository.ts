import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SolicitudesRepository } from '../core/consulta.repository';

@Injectable()
export class SolicitudesTypeOrmRepository implements SolicitudesRepository {
  constructor(private readonly db: DataSource) {}

  listar(usuarioId: string): Promise<Record<string, unknown>[]> {
    return this.db.query(
      `SELECT id, titulo, descripcion, modalidad, estado, categoria_id, zona_id, urgente, creada_en FROM solicitudes_servicio WHERE cliente_id = $1 ORDER BY id DESC LIMIT 100`,
      [usuarioId],
    );
  }
}
