import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DatosResumenServicio, PagosRepository } from '../core/consulta.repository';

@Injectable()
export class PagosTypeOrmRepository implements PagosRepository {
  constructor(private readonly db: DataSource) {}

  listar(usuarioId: string): Promise<Record<string, unknown>[]> {
    return this.db.query(
      `SELECT p.id, p.servicio_id, p.tipo, p.monto, p.moneda, p.metodo, CASE WHEN r.pago_id IS NULL THEN p.estado ELSE 'revertido' END AS estado FROM pagos p JOIN servicios s ON s.id = p.servicio_id LEFT JOIN reversiones_pago_simulado r ON r.pago_id=p.id WHERE s.cliente_id = $1 OR s.trabajador_id = $1 ORDER BY p.id DESC LIMIT 100`,
      [usuarioId],
    );
  }
    async resumenServicio(servicioId: string, usuarioId: string): Promise<DatosResumenServicio | undefined> {
    const [servicio] = await this.db.query(
      `SELECT r.total_acordado AS total, COALESCE(r.moneda, 'BOB') AS moneda
       FROM servicios s LEFT JOIN resumen_financiero_servicio r ON r.servicio_id = s.id
       WHERE s.id = $1 AND (s.cliente_id = $2 OR s.trabajador_id = $2)`,
      [servicioId, usuarioId],
    );
    if (!servicio) return undefined;

    const pagos = await this.db.query(
      `SELECT p.id, p.tipo, p.monto, p.metodo,
              CASE WHEN r.pago_id IS NULL THEN p.estado ELSE 'revertido' END AS estado
       FROM pagos p LEFT JOIN reversiones_pago_simulado r ON r.pago_id = p.id
       WHERE p.servicio_id = $1 ORDER BY p.id`,
      [servicioId],
    );
    return { total: servicio.total, moneda: servicio.moneda.trim(), pagos };
  }
}
