import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { VerificacionesRepository } from '../core/consulta.repository';

@Injectable()
export class VerificacionesTypeOrmRepository implements VerificacionesRepository {
  constructor(private readonly db: DataSource) {}

  listar(usuarioId: string): Promise<Record<string, unknown>[]> {
    return this.db.query(
      `SELECT id, estado, enviada_en, revisada_en, motivo_decision FROM solicitudes_verificacion WHERE trabajador_id = $1 ORDER BY id DESC LIMIT 100`,
      [usuarioId],
    );
  }
}
