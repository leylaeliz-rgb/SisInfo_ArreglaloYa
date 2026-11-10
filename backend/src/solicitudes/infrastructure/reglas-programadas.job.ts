import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
export class PrioridadSolicitudesJob implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrioridadSolicitudesJob.name);
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

  private async ejecutar() {
    if (this.ejecutando) return;
    this.ejecutando = true;
    try {
      await this.db.query(`WITH elegibles AS (
  SELECT s.id,s.prioridad_nivel,s.prioridad_maxima_desde,
         LEAST(3,1+FLOOR(EXTRACT(EPOCH FROM (NOW()-s.creada_en))/86400)::int) AS nivel
  FROM solicitudes_servicio s
  WHERE s.estado='publicada'
    AND NOT EXISTS (SELECT 1 FROM cotizaciones c WHERE c.solicitud_id=s.id)
  FOR UPDATE OF s SKIP LOCKED
), cambios AS (
  UPDATE solicitudes_servicio s
  SET prioridad_nivel=GREATEST(e.prioridad_nivel,e.nivel),
      prioridad_maxima_desde=CASE WHEN e.nivel=3 THEN COALESCE(e.prioridad_maxima_desde,NOW()) ELSE e.prioridad_maxima_desde END,
      estado=CASE WHEN e.prioridad_maxima_desde < NOW()-INTERVAL '3 days' THEN 'archivada' ELSE s.estado END,
      motivo_cancelacion=CASE WHEN e.prioridad_maxima_desde < NOW()-INTERVAL '3 days' THEN 'Caducidad sin ofertas' ELSE s.motivo_cancelacion END,
      actualizada_en=NOW()
  FROM elegibles e WHERE s.id=e.id AND (e.nivel>e.prioridad_nivel OR e.prioridad_maxima_desde<NOW()-INTERVAL '3 days')
  RETURNING s.id,e.prioridad_nivel AS anterior,s.prioridad_nivel AS nueva,s.estado
)
INSERT INTO historial_prioridad_solicitud (solicitud_id,prioridad_anterior,prioridad_nueva,motivo)
SELECT id,anterior,nueva,CASE WHEN estado='archivada' THEN 'Caducidad sin ofertas' ELSE 'Escalamiento automático' END FROM cambios`);
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
    } finally {
      this.ejecutando = false;
    }
  }
}
