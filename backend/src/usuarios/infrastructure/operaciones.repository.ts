import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OperacionesUsuariosRepository, ResultadoUsuarios } from '../core/operaciones.repository';

@Injectable()
export class OperacionesUsuariosTypeOrmRepository implements OperacionesUsuariosRepository {
  constructor(private readonly db: DataSource) {}

  async actualizarPerfil(usuarioId: string, nombreCompleto: string): Promise<ResultadoUsuarios | undefined> {
    const [fila] = await this.db.query(
      `UPDATE usuarios SET nombre_completo=$2, actualizado_en=NOW() WHERE id=$1 AND estado_cuenta='activa' RETURNING id, nombre_completo AS "nombreCompleto", telefono`,
      [usuarioId, nombreCompleto],
    );
    return fila;
  }

  async desactivar(usuarioId: string): Promise<ResultadoUsuarios | undefined> {
    const [fila] = await this.db.query(
      `UPDATE usuarios SET estado_cuenta='inactiva',actualizado_en=NOW() WHERE id=$1 AND estado_cuenta='activa'
AND NOT EXISTS (SELECT 1 FROM servicios WHERE (cliente_id=$1 OR trabajador_id=$1) AND estado NOT IN ('finalizado','cancelado'))
RETURNING id,estado_cuenta`,
      [usuarioId],
    );
    return fila;
  }
}
