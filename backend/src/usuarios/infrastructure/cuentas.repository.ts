import { Injectable } from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';
import { Cuenta, CuentasRepository, TelefonoDuplicado } from '../core/cuenta';

const columnas = `u.id, u.nombre_completo AS "nombreCompleto", u.telefono,
  ARRAY(SELECT lower(r.codigo) FROM usuario_roles ur JOIN roles r ON r.id = ur.rol_id
        WHERE ur.usuario_id = u.id ORDER BY r.codigo) AS roles`;

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
        const asignados = await tx.query(
          'INSERT INTO usuario_roles (usuario_id, rol_id) SELECT $1, id FROM roles WHERE codigo = $2 RETURNING rol_id',
          [id, rol.toUpperCase()],
        );
        if (asignados.length !== 1) {
          throw new Error('Falta cargar el rol de registro.');
        }
        return { id, nombreCompleto: nombre, telefono, roles: [rol] };
      });
    } catch (error) {
      if (error instanceof QueryFailedError && error.driverError.constraint === 'usuarios_telefono_key') {
        throw new TelefonoDuplicado();
      }
      throw error;
    }
  }
}
