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

  async retirarPerfil(usuarioId: string): Promise<ResultadoTrabajadores | undefined> {
    const [fila] = await this.db.query(
      `UPDATE perfiles_trabajador SET disponible=FALSE, actualizado_en=NOW() WHERE usuario_id=$1
AND NOT EXISTS (SELECT 1 FROM servicios WHERE trabajador_id=$1 AND estado NOT IN ('finalizado','cancelado'))
RETURNING usuario_id,disponible`,
      [usuarioId],
    );
    return fila;
  }

  async buscar(usuarioId: string): Promise<ResultadoTrabajadores[]> {
    return await this.db.query(
      `SELECT p.usuario_id,p.zona_base_id,p.descripcion,u.nombre_completo
FROM perfiles_trabajador p JOIN usuarios u ON u.id=p.usuario_id AND u.estado_cuenta='activa'
WHERE p.estado_verificacion='aprobado' AND p.disponible AND p.usuario_id<>$1
AND NOT EXISTS (SELECT 1 FROM pausas_disponibilidad WHERE trabajador_id=p.usuario_id AND reactivada_en IS NULL)
AND NOT EXISTS (SELECT 1 FROM suspensiones_trabajador WHERE trabajador_id=p.usuario_id AND estado IN ('programada','activa') AND NOW()>=inicia_en AND NOW()<termina_en)
ORDER BY p.usuario_id LIMIT 100`,
      [usuarioId],
    );
  }

  async pausar(usuarioId: string, dias: number): Promise<ResultadoTrabajadores | undefined> {
    const [fila] = await this.db.query(
      `WITH perfil AS (
 SELECT usuario_id FROM perfiles_trabajador WHERE usuario_id=$1 FOR UPDATE
), nueva AS (
 INSERT INTO pausas_disponibilidad (trabajador_id,iniciada_en,reactivacion_prevista_en,fecha_limite_reactivacion)
 SELECT usuario_id,NOW(),NOW()+make_interval(days => $2),NOW()+INTERVAL '60 days' FROM perfil
 ON CONFLICT DO NOTHING RETURNING id,trabajador_id,reactivacion_prevista_en,fecha_limite_reactivacion
), cambio AS (
 UPDATE perfiles_trabajador p SET disponible=FALSE,actualizado_en=NOW()
 FROM nueva n WHERE p.usuario_id=n.trabajador_id
) SELECT id,reactivacion_prevista_en,fecha_limite_reactivacion FROM nueva`,
      [usuarioId, dias],
    );
    return fila;
  }

  async reactivar(usuarioId: string): Promise<ResultadoTrabajadores | undefined> {
    const [fila] = await this.db.query(
      `UPDATE pausas_disponibilidad SET reactivada_en=NOW()
WHERE trabajador_id=$1 AND reactivada_en IS NULL AND NOW()<fecha_limite_reactivacion
RETURNING id,reactivada_en`,
      [usuarioId],
    );
    return fila;
  }
}
