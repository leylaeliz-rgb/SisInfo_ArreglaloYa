import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ReclamosRepository } from '../core/consulta.repository';

@Injectable()
export class ReclamosTypeOrmRepository implements ReclamosRepository {
  constructor(private readonly db: DataSource) {}

  listar(usuarioId: string, rolActivo: string): Promise<Record<string, unknown>[]> {
    return this.db.query(
      `SELECT r.id, r.servicio_id, r.descripcion, r.tipo, r.estado, r.presentado_en, r.resultado
       FROM reclamos r JOIN servicios s ON s.id = r.servicio_id
       WHERE CASE WHEN $2 = 'trabajador' THEN s.trabajador_id = $1 ELSE r.cliente_id = $1 END
       ORDER BY r.id DESC LIMIT 100`,
      [usuarioId, rolActivo],
    );
  }
}
