import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OperacionesUsuariosRepository, ResultadoUsuarios, ServiciosAbiertos } from '../core/operaciones.repository';

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
    return this.db.transaction(async (tx) => {
      const [cuenta] = await tx.query(
        "SELECT id FROM usuarios WHERE id=$1 AND estado_cuenta='activa' FOR UPDATE",
        [usuarioId],
      );
      if (!cuenta) return undefined;

      const [abierto] = await tx.query(
        `SELECT 1 FROM servicios
         WHERE (cliente_id=$1 OR trabajador_id=$1) AND estado NOT IN ('finalizado','cancelado')
         LIMIT 1`,
        [usuarioId],
      );
      if (abierto) throw new ServiciosAbiertos();

      // Si la cuenta tiene perfil profesional, deja de aparecer como disponible.
      await tx.query(
        'UPDATE perfiles_trabajador SET disponible=FALSE, actualizado_en=NOW() WHERE usuario_id=$1',
        [usuarioId],
      );
      const [fila] = await tx.query(
        `UPDATE usuarios SET estado_cuenta='inactiva', actualizado_en=NOW()
         WHERE id=$1 RETURNING id, estado_cuenta`,
        [usuarioId],
      );
      return fila;
    });
  }

  async inscribirseComoTrabajador(usuarioId: string): Promise<ResultadoUsuarios | undefined> {
    return this.db.transaction(async (tx) => {
      const [cuenta] = await tx.query(
        "SELECT id FROM usuarios WHERE id=$1 AND estado_cuenta='activa' FOR UPDATE",
        [usuarioId],
      );
      if (!cuenta) return undefined;

      const roles = await tx.query(
        "SELECT id FROM roles WHERE codigo IN ('CLIENTE','TRABAJADOR')",
      );
      if (roles.length !== 2) {
        throw new Error('Faltan los roles CLIENTE y TRABAJADOR en el catálogo.');
      }

      await tx.query(
        `INSERT INTO usuario_roles (usuario_id,rol_id)
         SELECT $1,id FROM roles WHERE codigo IN ('CLIENTE','TRABAJADOR')
         ON CONFLICT (usuario_id,rol_id) DO NOTHING`,
        [usuarioId],
      );
      return { id: cuenta.id, roles: ['cliente', 'trabajador'] };
    });
  }

  async aceptarTerminos(usuarioId: string, version: string, ip: string | null): Promise<ResultadoUsuarios | undefined> {
    // El DO UPDATE sin cambios hace que RETURNING devuelva también la fila ya existente.
    const [fila] = await this.db.query(
      `INSERT INTO aceptaciones_terminos (usuario_id, version_terminos, ip_origen)
       VALUES ($1, $2, $3::inet)
       ON CONFLICT (usuario_id, version_terminos)
       DO UPDATE SET version_terminos = EXCLUDED.version_terminos
       RETURNING version_terminos AS "version", aceptado_en AS "aceptadoEn"`,
      [usuarioId, version, ip],
    );
    return fila;
  }

  async terminosAceptados(usuarioId: string): Promise<ResultadoUsuarios[]> {
    return this.db.query(
      `SELECT version_terminos AS "version", aceptado_en AS "aceptadoEn"
       FROM aceptaciones_terminos WHERE usuario_id=$1 ORDER BY aceptado_en DESC`,
      [usuarioId],
    );
  }
}
