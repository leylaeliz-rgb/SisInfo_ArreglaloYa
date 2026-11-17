import { Injectable } from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';
import { Cuenta, CuentasRepository, TelefonoDuplicado } from '../core/cuenta';

const columnas = `u.id, u.nombre_completo AS "nombreCompleto", u.telefono,
  ARRAY(
    SELECT DISTINCT lower(efectivo.codigo)
    FROM usuario_roles ur
    JOIN roles asignado ON asignado.id=ur.rol_id
    JOIN roles efectivo ON efectivo.id=asignado.id
      OR (asignado.codigo='TRABAJADOR' AND efectivo.codigo='CLIENTE')
      OR (asignado.codigo='ADMINISTRADOR' AND efectivo.codigo IN ('CLIENTE','TRABAJADOR'))
    WHERE ur.usuario_id=u.id ORDER BY lower(efectivo.codigo)
  ) AS roles`;

@Injectable()
export class CuentasTypeOrmRepository implements CuentasRepository {
  constructor(private readonly db: DataSource) {}

  async buscar(id: string): Promise<Cuenta | undefined> {
    const [cuenta] = await this.db.query(
      `SELECT ${columnas} FROM usuarios u WHERE id = $1 AND estado_cuenta = 'activa'`, [id],
    );
    return cuenta;
  }

  async credenciales(telefono: string): Promise<(Cuenta & { passwordHash: string }) | undefined> {
    const [cuenta] = await this.db.query(
      `SELECT ${columnas}, password_hash AS "passwordHash" FROM usuarios u
       WHERE telefono = $1 AND estado_cuenta = 'activa'`, [telefono],
    );
    return cuenta;
  }

  async crear(nombre: string, telefono: string, hash: string, rol: string): Promise<Cuenta> {
    try {
      return await this.db.transaction(async (tx) => {
        const [{ id }] = await tx.query(
          'INSERT INTO usuarios (nombre_completo, telefono, password_hash) VALUES ($1, $2, $3) RETURNING id',
          [nombre, telefono, hash],
        );
        const codigos = rol === 'trabajador' ? ['CLIENTE', 'TRABAJADOR'] : ['CLIENTE'];
        const asignados = await tx.query(
          'INSERT INTO usuario_roles (usuario_id, rol_id) SELECT $1, id FROM roles WHERE codigo = ANY($2::text[]) RETURNING rol_id',
          [id, codigos],
        );
        if (asignados.length !== codigos.length) {
          throw new Error('Falta cargar el rol de registro.');
        }
        return { id, nombreCompleto: nombre, telefono, roles: codigos.map((codigo) => codigo.toLowerCase()) };
      });
    } catch (error) {
      if (error instanceof QueryFailedError && error.driverError.constraint === 'usuarios_telefono_key') {
        throw new TelefonoDuplicado();
      }
      throw error;
    }
  }

  async hashDe(id: string): Promise<string | undefined> {
    const [fila] = await this.db.query(
      `SELECT password_hash AS "passwordHash" FROM usuarios WHERE id = $1 AND estado_cuenta = 'activa'`, [id],
    );
    return fila?.passwordHash;
  }

  async cambiarHash(id: string, hashAnterior: string, hashNuevo: string): Promise<boolean> {
    const filas = await this.db.query(
      `UPDATE usuarios SET password_hash = $3, actualizado_en = NOW()
       WHERE id = $1 AND estado_cuenta = 'activa' AND password_hash = $2
       RETURNING id`,
      [id, hashAnterior, hashNuevo],
    );
    return filas.length > 0;
  }

  async credencialesInactivas(telefono: string): Promise<{ id: string; passwordHash: string } | undefined> {
    const [fila] = await this.db.query(
      `SELECT id, password_hash AS "passwordHash" FROM usuarios
       WHERE telefono = $1 AND estado_cuenta = 'inactiva'`, [telefono],
    );
    return fila;
  }

  async reactivar(id: string): Promise<boolean> {
    const filas = await this.db.query(
      `UPDATE usuarios SET estado_cuenta = 'activa', actualizado_en = NOW()
       WHERE id = $1 AND estado_cuenta = 'inactiva'
       RETURNING id`, [id],
    );
    return filas.length > 0;
  }
}
