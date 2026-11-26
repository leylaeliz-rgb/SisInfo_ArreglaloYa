
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import {
  ConfiguracionEscalamiento,
  ConfiguracionEscalamientoRepository,
} from '../core/configuracion-escalamiento.repository';

@Injectable()
export class ConfiguracionEscalamientoTypeOrmRepository
  implements ConfiguracionEscalamientoRepository { // implements significa que esta clase
    // se copmremete a cumplir el contrato que definimos en core

  constructor(private readonly db: DataSource) {} // conexión a la bdd

  async obtener(): Promise<
    ConfiguracionEscalamiento | undefined
  > {

    const [fila] = await this.db.query(
      `SELECT
        plazo_atencion_horas AS "plazoAtencionHoras",
        actualizado_en AS "actualizadoEn",
        actualizado_por::text AS "actualizadoPor"
       FROM configuracion_escalamiento_reclamos
       WHERE id = 1`
    );

    return fila;
  }

  async actualizar(
    usuarioId: string,
    plazoHoras: number
  ): Promise<ConfiguracionEscalamiento | undefined> {

    return this.db.transaction(async (tx) => {

      const [anterior] = await tx.query(
        `SELECT plazo_atencion_horas AS "plazoAtencionHoras"
         FROM configuracion_escalamiento_reclamos
         WHERE id = 1
         FOR UPDATE`
      );

      if (!anterior) {
        return undefined;
      }

      const plazoAnterior = Number(
        anterior.plazoAtencionHoras
      );

      // Si el plazo no cambia, no necesitamos
      // registrar una modificación en el historial.
      if (plazoAnterior === plazoHoras) {
        return this.obtener();
      }

      const [actualizado] = await tx.query(
        `UPDATE configuracion_escalamiento_reclamos
         SET plazo_atencion_horas = $1,
             actualizado_por = $2,
             actualizado_en = NOW()
         WHERE id = 1
         RETURNING
           plazo_atencion_horas AS "plazoAtencionHoras",
           actualizado_en AS "actualizadoEn",
           actualizado_por::text AS "actualizadoPor"`,
        [plazoHoras, usuarioId]
      );

      if (!actualizado) {
        return undefined;
      }

      await tx.query(
        `INSERT INTO historial_configuracion_escalamiento_reclamos
         (plazo_anterior, plazo_nuevo, cambiado_por)
         VALUES ($1, $2, $3)`,
        [plazoAnterior, plazoHoras, usuarioId]
      );

      return actualizado;
    });
  }
}
