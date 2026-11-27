import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
export class VigenciaDocumentosJob implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VigenciaDocumentosJob.name);
  private timer?: ReturnType<typeof setInterval>;
  private ejecutando = false;

  constructor(private readonly db: DataSource, private readonly config: ConfigService) {}

  onModuleInit() {
    if (this.config.get<string>('REGLAS_PROGRAMADAS') !== 'true') return;
    this.timer = setInterval(() => void this.ejecutar(), 60_000);
    this.timer.unref();
  }

  onModuleDestroy() {
    clearInterval(this.timer);
  }

  async ejecutar() {
    if (this.ejecutando) return;
    this.ejecutando = true;
    try {
      await this.db.query(`
        WITH vencidos AS (
          UPDATE documentos_verificacion d
          SET estado_vigencia = 'vencido'
          FROM solicitudes_verificacion v
          WHERE v.id = d.solicitud_verificacion_id
            AND d.estado_vigencia IN ('vigente', 'por_vencer')
            AND d.fecha_vencimiento IS NOT NULL
            AND d.fecha_vencimiento < CURRENT_DATE
          RETURNING d.id AS documento_id, v.trabajador_id, d.tipo_documento, d.fecha_vencimiento
        ),
        alertas_vencidos AS (
          INSERT INTO alertas_documentos (trabajador_id, documento_id, tipo_alerta, mensaje)
          SELECT trabajador_id, documento_id, 'vencido',
                 'Tu documento (' || tipo_documento || ') venció el ' || to_char(fecha_vencimiento, 'DD/MM/YYYY') || '. Renuévalo para seguir cotizando.'
          FROM vencidos
          ON CONFLICT (documento_id, tipo_alerta) DO NOTHING
        ),
        por_vencer AS (
          UPDATE documentos_verificacion d
          SET estado_vigencia = 'por_vencer'
          FROM solicitudes_verificacion v, tipos_documento_verificacion t
          WHERE v.id = d.solicitud_verificacion_id
            AND t.tipo = d.tipo_documento
            AND d.estado_vigencia = 'vigente'
            AND d.fecha_vencimiento IS NOT NULL
            AND d.fecha_vencimiento >= CURRENT_DATE
            AND d.fecha_vencimiento <= CURRENT_DATE + make_interval(days => t.dias_alerta_previa)
          RETURNING d.id AS documento_id, v.trabajador_id, d.tipo_documento, d.fecha_vencimiento
        )
        INSERT INTO alertas_documentos (trabajador_id, documento_id, tipo_alerta, mensaje)
        SELECT trabajador_id, documento_id, 'por_vencer',
               'Tu documento (' || tipo_documento || ') vence el ' || to_char(fecha_vencimiento, 'DD/MM/YYYY') || '.'
        FROM por_vencer
        ON CONFLICT (documento_id, tipo_alerta) DO NOTHING
      `);
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
    } finally {
      this.ejecutando = false;
    }
  }
}