import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RevocacionesSesion } from '../core/seguridad';

@Injectable()
export class RevocacionesTypeOrmRepository implements RevocacionesSesion {
  constructor(private readonly db: DataSource) {}

  async existe(sesionId: string) {
    const [fila] = await this.db.query('SELECT 1 FROM sesiones_revocadas WHERE id=$1', [sesionId]);
    return Boolean(fila);
  }

  async registrar(sesionId: string, expiraEn: number) {
    await this.db.query(
      'INSERT INTO sesiones_revocadas (id, expira_en) VALUES ($1,to_timestamp($2)) ON CONFLICT DO NOTHING',
      [sesionId, expiraEn],
    );
  }
}
