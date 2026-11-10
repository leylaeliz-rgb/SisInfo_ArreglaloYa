import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OperacionesCalificacionesRepository, ResultadoCalificaciones } from '../core/operaciones.repository';

@Injectable()
export class OperacionesCalificacionesTypeOrmRepository implements OperacionesCalificacionesRepository {
  constructor(private readonly db: DataSource) {}

  async guardar(usuarioId: string, recursoId: string, estrellas: number, comentario: string): Promise<ResultadoCalificaciones | undefined> {
    const [fila] = await this.db.query(
      `INSERT INTO calificaciones_trabajador (servicio_id,cliente_id,trabajador_id,estrellas,comentario) SELECT id,cliente_id,trabajador_id,$3,$4 FROM servicios WHERE cliente_id=$1 AND id=$2 AND estado='finalizado' ON CONFLICT (servicio_id) DO UPDATE SET estrellas=EXCLUDED.estrellas, comentario=EXCLUDED.comentario, actualizada_en=NOW() WHERE calificaciones_trabajador.cliente_id=$1 AND calificaciones_trabajador.retirada_en IS NULL RETURNING id,servicio_id,estrellas,comentario`,
      [usuarioId, recursoId, estrellas, comentario],
    );
    return fila;
  }

  async retirar(usuarioId: string, recursoId: string): Promise<ResultadoCalificaciones | undefined> {
    const [fila] = await this.db.query(
      `UPDATE calificaciones_trabajador
       SET retirada_en=COALESCE(retirada_en,NOW())
       WHERE cliente_id=$1 AND servicio_id=$2 RETURNING id, retirada_en`,
      [usuarioId, recursoId],
    );
    return fila;
  }

  async reputacion(usuarioId: string, recursoId: string): Promise<ResultadoCalificaciones | undefined> {
    const [fila] = await this.db.query(
      `SELECT COUNT(c.id)::int AS total, ROUND(AVG(c.estrellas),2) AS promedio
FROM perfiles_trabajador p LEFT JOIN calificaciones_trabajador c ON c.trabajador_id=p.usuario_id AND c.retirada_en IS NULL
WHERE p.usuario_id=$2 AND p.estado_verificacion='aprobado' AND $1::bigint IS NOT NULL GROUP BY p.usuario_id`,
      [usuarioId, recursoId],
    );
    return fila;
  }

  async evaluarCliente(usuarioId: string, recursoId: string, valoracion: number, descripcion: string): Promise<ResultadoCalificaciones | undefined> {
    const [fila] = await this.db.query(
      `INSERT INTO evaluaciones_internas_cliente (servicio_id,trabajador_id,cliente_id,valoracion,descripcion)
SELECT id,trabajador_id,cliente_id,$3,$4 FROM servicios WHERE id=$2 AND trabajador_id=$1 AND estado='finalizado'
ON CONFLICT (servicio_id) DO UPDATE SET valoracion=EXCLUDED.valoracion,descripcion=EXCLUDED.descripcion
WHERE evaluaciones_internas_cliente.trabajador_id=$1 RETURNING id,servicio_id,valoracion`,
      [usuarioId, recursoId, valoracion, descripcion],
    );
    return fila;
  }

  async referenciasCliente(usuarioId: string, recursoId: string): Promise<ResultadoCalificaciones[]> {
    return await this.db.query(
      `SELECT e.valoracion,e.descripcion,e.creada_en FROM evaluaciones_internas_cliente e
WHERE e.cliente_id=$2 AND e.cliente_id<>$1
AND EXISTS (SELECT 1 FROM perfiles_trabajador WHERE usuario_id=$1 AND estado_verificacion='aprobado')
AND EXISTS (SELECT 1 FROM servicios WHERE cliente_id=$2 AND trabajador_id=$1 AND estado NOT IN ('cancelado','finalizado'))
ORDER BY e.id DESC LIMIT 100`,
      [usuarioId, recursoId],
    );
  }
}
