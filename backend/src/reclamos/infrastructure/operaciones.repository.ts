import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OperacionesReclamosRepository, ResultadoReclamos } from '../core/operaciones.repository';

@Injectable()
export class OperacionesReclamosTypeOrmRepository implements OperacionesReclamosRepository {
  constructor(private readonly db: DataSource) {}

  async presentar(usuarioId: string, recursoId: string, descripcion: string, tipo: string): Promise<ResultadoReclamos | undefined> {
    const [fila] = await this.db.query(
      `WITH nuevo AS (INSERT INTO reclamos (servicio_id,cliente_id,descripcion,tipo) SELECT id,cliente_id,$3,$4 FROM servicios WHERE cliente_id=$1 AND id=$2 AND estado='finalizado' AND NOW() <= finalizado_en + INTERVAL '7 days' RETURNING id,estado), historial AS (INSERT INTO historial_reclamo (reclamo_id,estado_nuevo,cambiado_por) SELECT id,estado,$1 FROM nuevo) SELECT * FROM nuevo`,
      [usuarioId, recursoId, descripcion, tipo],
    );
    return fila;
  }

  async resolver(usuarioId: string, recursoId: string, estado: string, resultado: string): Promise<ResultadoReclamos | undefined> {
    const [fila] = await this.db.query(
      `WITH previo AS (SELECT id,estado FROM reclamos WHERE id=$2 AND estado IN ('pendiente','en_revision') FOR UPDATE), cambio AS (UPDATE reclamos r SET estado=$3, resultado=$4, resuelto_en=NOW(), asignado_a=$1 FROM previo p WHERE r.id=p.id RETURNING r.id,r.estado,p.estado AS anterior), historial AS (INSERT INTO historial_reclamo (reclamo_id,estado_anterior,estado_nuevo,cambiado_por,observacion) SELECT id,anterior,estado,$1,$4 FROM cambio) SELECT id,estado FROM cambio`,
      [usuarioId, recursoId, estado, resultado],
    );
    return fila;
  }

  async retirar(usuarioId: string, recursoId: string): Promise<ResultadoReclamos | undefined> {
    const [fila] = await this.db.query(
      `WITH cambio AS (
UPDATE reclamos SET estado='rechazado',resultado='Retirado por el cliente',resuelto_en=NOW()
WHERE id=$2 AND cliente_id=$1 AND estado='pendiente' RETURNING id,estado
), historial AS (
INSERT INTO historial_reclamo (reclamo_id,estado_anterior,estado_nuevo,cambiado_por,observacion)
SELECT id,'pendiente',estado,$1,'Retirado por el cliente' FROM cambio
) SELECT * FROM cambio`,
      [usuarioId, recursoId],
    );
    return fila;
  }
  historialAsignaciones(reclamoId: string): Promise<Record<string, unknown>[]> {
    return this.db.query(
      `SELECT
         reclamo_id::text AS reclamo_id,
         responsable_anterior::text AS responsable_anterior,
         responsable_nuevo::text AS responsable_nuevo,
         cambiado_por::text AS cambiado_por,
         origen,
         motivo,
         cambiado_en
       FROM historial_asignacion_reclamo
       WHERE reclamo_id = $1
       ORDER BY cambiado_en DESC`,
      [reclamoId],
    );
  }

  async reasignar(
  usuarioId: string,
  reclamoId: string,
  nuevoResponsableId: string,
  motivo: string,
): Promise<ResultadoReclamos | undefined> {

  const transaccion = this.db.createQueryRunner();

  await transaccion.connect();
  await transaccion.startTransaction();

  try {

    // 1. Buscar y bloquear el reclamo.
    const [reclamo] = await transaccion.query(
      `SELECT id, estado, escalado_en, asignado_a
       FROM reclamos
       WHERE id = $1
       FOR UPDATE`,
      [reclamoId],
    );

    // 2. Comprobar que el reclamo puede reasignarse.
    if (
      !reclamo ||
      !reclamo.escalado_en ||
      !['pendiente', 'en_revision'].includes(reclamo.estado)
    ) {
      await transaccion.rollbackTransaction();
      return undefined;
    }

    // 3. Comprobar que el nuevo responsable
    // es un administrador con cuenta activa.
    const [responsable] = await transaccion.query(
      `SELECT u.id
       FROM usuarios u
       INNER JOIN usuario_roles ur
         ON ur.usuario_id = u.id
       INNER JOIN roles ro
         ON ro.id = ur.rol_id
       WHERE u.id = $1
         AND u.estado_cuenta = 'activa'
         AND ro.codigo = 'ADMINISTRADOR'
       LIMIT 1`,
      [nuevoResponsableId],
    );

    if (!responsable) {
      await transaccion.rollbackTransaction();
      return undefined;
    }

    // 4. Evitar asignar el reclamo al mismo responsable.
    if (
      reclamo.asignado_a !== null &&
      reclamo.asignado_a !== undefined &&
      String(reclamo.asignado_a) === nuevoResponsableId
    ) {
      await transaccion.rollbackTransaction();
      return undefined;
    }

    // 5. Actualizar el responsable del reclamo.
    const [actualizado] = await transaccion.query(
      `UPDATE reclamos
       SET asignado_a = $2
       WHERE id = $1
       RETURNING id, estado, asignado_a, escalado_en`,
      [reclamoId, nuevoResponsableId],
    );

    if (!actualizado) {
      await transaccion.rollbackTransaction();
      return undefined;
    }

    // 6. Registrar el cambio en el historial.
    await transaccion.query(
      `INSERT INTO historial_asignacion_reclamo (
        reclamo_id,
        responsable_anterior,
        responsable_nuevo,
        cambiado_por,
        origen,
        motivo,
        cambiado_en
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        reclamoId,
        reclamo.asignado_a,
        nuevoResponsableId,
        usuarioId,
        'manual',
        motivo,
      ],
    );

    await transaccion.commitTransaction();

    return actualizado;

  } catch (error) {

    await transaccion.rollbackTransaction();
    throw error;

  } finally {

    await transaccion.release();

  }
}
}
