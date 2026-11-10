import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
export class PausasVencidasJob implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PausasVencidasJob.name);
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
      await this.db.query(`WITH vencidas AS (
  SELECT p.trabajador_id FROM pausas_disponibilidad p
  WHERE p.reactivada_en IS NULL AND p.fecha_limite_reactivacion <= NOW()
  FOR UPDATE OF p SKIP LOCKED
)
UPDATE usuarios u SET estado_cuenta='eliminada',eliminado_en=NOW(),actualizado_en=NOW()
FROM vencidas v WHERE u.id=v.trabajador_id AND u.estado_cuenta='activa'
AND NOT EXISTS (
 SELECT 1 FROM servicios s WHERE (s.cliente_id=u.id OR s.trabajador_id=u.id) AND
 (s.estado NOT IN ('finalizado','cancelado') OR (s.estado='finalizado' AND NOT EXISTS (
   SELECT 1 FROM pagos WHERE servicio_id=s.id AND tipo='saldo' AND estado='confirmado'
 )))
)`);
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
    } finally {
      this.ejecutando = false;
    }
  }
}
