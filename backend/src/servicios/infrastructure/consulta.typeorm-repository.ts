import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ServiciosRepository } from '../core/consulta.repository';

@Injectable()
export class ServiciosTypeOrmRepository implements ServiciosRepository {
  constructor(private readonly db: DataSource) {}

  listar(usuarioId: string): Promise<Record<string, unknown>[]> {
    return this.db.query(
      `SELECT id, solicitud_id, cotizacion_id, estado, cliente_id, trabajador_id FROM servicios WHERE cliente_id = $1 OR trabajador_id = $1 ORDER BY id DESC LIMIT 100`,
      [usuarioId],
    );
  }
}
