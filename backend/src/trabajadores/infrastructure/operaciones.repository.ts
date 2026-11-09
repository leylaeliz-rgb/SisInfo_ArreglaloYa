import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OperacionesTrabajadoresRepository, ResultadoTrabajadores } from '../core/operaciones.repository';

@Injectable()
export class OperacionesTrabajadoresTypeOrmRepository implements OperacionesTrabajadoresRepository {
  constructor(private readonly db: DataSource) {}

  async cambiarDisponibilidad(usuarioId: string, disponible: boolean): Promise<ResultadoTrabajadores | undefined> {
    const [fila] = await this.db.query(
      `UPDATE perfiles_trabajador p SET disponible=$2, actualizado_en=NOW() WHERE p.usuario_id=$1 AND (NOT $2 OR (p.estado_verificacion='aprobado' AND NOT EXISTS (SELECT 1 FROM pausas_disponibilidad WHERE trabajador_id=$1 AND reactivada_en IS NULL) AND NOT EXISTS (SELECT 1 FROM suspensiones_trabajador WHERE trabajador_id=$1 AND estado IN ('activa','programada') AND NOW()>=inicia_en AND NOW()<termina_en))) RETURNING usuario_id,disponible`,
      [usuarioId, disponible],
    );
    return fila;
  }
}
