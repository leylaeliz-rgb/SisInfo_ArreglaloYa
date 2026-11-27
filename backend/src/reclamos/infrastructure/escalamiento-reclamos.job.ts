
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
export class EscalamientoReclamosJob
  implements OnModuleInit, OnModuleDestroy {

  private readonly logger = new Logger(
    EscalamientoReclamosJob.name
  );

  private timer?: ReturnType<typeof setInterval>;

  private ejecutando = false;

  constructor(
    private readonly db: DataSource,
    private readonly config: ConfigService
  ) {}

  onModuleInit() {
    if (
      this.config.get<string>('REGLAS_PROGRAMADAS') !== 'true'
    ) {
      this.logger.warn(
        'Escalamiento automático de reclamos desactivado.'
      );
      return;
    }

    this.logger.log(
      'Escalamiento automático de reclamos iniciado.'
    );

    // Realiza una revisión al iniciar el backend.
    void this.ejecutar();

    // Después revisa cada 60 segundos.
    this.timer = setInterval(
      () => void this.ejecutar(),
      60_000
    );

    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async ejecutar() {

    // Evita ejecuciones simultáneas en esta instancia.
    if (this.ejecutando) return;

    this.ejecutando = true;

    try {

      const [fila] = await this.db.query(`
        WITH configuracion AS (
          SELECT plazo_atencion_horas
          FROM configuracion_escalamiento_reclamos
          WHERE id = 1
        ),

        elegibles AS MATERIALIZED (
          SELECT r.id
          FROM reclamos r

          CROSS JOIN configuracion c

          WHERE r.estado IN ('pendiente', 'en_revision')
            AND r.escalado_en IS NULL

            AND r.presentado_en <=
              NOW() - make_interval(
                hours => c.plazo_atencion_horas
              )

          ORDER BY r.presentado_en ASC

          FOR UPDATE OF r SKIP LOCKED
        ),

        escalados AS (
          UPDATE reclamos r

          SET escalado_en = NOW()

          FROM elegibles e

          WHERE r.id = e.id
            AND r.escalado_en IS NULL

          RETURNING r.id
        )

        SELECT COUNT(*)::int AS cantidad
        FROM escalados
      `);

      const cantidad = Number(
        fila?.cantidad ?? 0
      );

      if (cantidad > 0) {
        this.logger.log(
          `${cantidad} reclamo(s) escalado(s) automáticamente.`
        );
      }

    } catch (error) {

      this.logger.error(
        'Error al revisar los reclamos vencidos.',
        error instanceof Error
          ? error.stack
          : String(error)
      );

    } finally {

      this.ejecutando = false;

    }
  }
}
