import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CotizacionesRepository } from '../core/consulta.repository';

@Injectable()
export class CotizacionesTypeOrmRepository implements CotizacionesRepository {
  constructor(private readonly db: DataSource) {}

  listar(usuarioId: string): Promise<Record<string, unknown>[]> {
    return this.db.query(
      `SELECT c.id, c.solicitud_id, c.trabajador_id, c.monto_estimado_total, c.moneda, c.estado FROM cotizaciones c JOIN solicitudes_servicio s ON s.id = c.solicitud_id WHERE c.trabajador_id = $1 OR s.cliente_id = $1 ORDER BY c.id DESC LIMIT 100`,
      [usuarioId],
    );
  }
}
