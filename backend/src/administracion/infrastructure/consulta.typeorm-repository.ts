import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AdministracionRepository } from '../core/consulta.repository';

@Injectable()
export class AdministracionTypeOrmRepository implements AdministracionRepository {
  constructor(private readonly db: DataSource) {}

  listar(): Promise<Record<string, unknown>[]> {
    return this.db.query(
      `SELECT id, trabajador_id, motivo, estado, inicia_en, termina_en FROM suspensiones_trabajador ORDER BY id DESC LIMIT 100`,
    );
  }
}
