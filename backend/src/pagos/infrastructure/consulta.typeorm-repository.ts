import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PagosRepository } from '../core/consulta.repository';

@Injectable()
export class PagosTypeOrmRepository implements PagosRepository {
  constructor(private readonly db: DataSource) {}

  listar(usuarioId: string): Promise<Record<string, unknown>[]> {
    return this.db.query(
      `SELECT p.id, p.servicio_id, p.tipo, p.monto, p.moneda, p.metodo, p.estado FROM pagos p JOIN servicios s ON s.id = p.servicio_id WHERE s.cliente_id = $1 OR s.trabajador_id = $1 ORDER BY p.id DESC LIMIT 100`,
      [usuarioId],
    );
  }
}
