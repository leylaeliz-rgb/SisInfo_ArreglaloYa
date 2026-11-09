import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OperacionesCatalogosRepository, ResultadoCatalogos } from '../core/operaciones.repository';

@Injectable()
export class OperacionesCatalogosTypeOrmRepository implements OperacionesCatalogosRepository {
  constructor(private readonly db: DataSource) {}

  async crearCategoria(usuarioId: string, codigo: string, nombre: string): Promise<ResultadoCatalogos | undefined> {
    const [fila] = await this.db.query(
      `INSERT INTO categorias (codigo,nombre) SELECT $2,$3 WHERE $1::bigint IS NOT NULL ON CONFLICT DO NOTHING RETURNING id,codigo,nombre,activa`,
      [usuarioId, codigo, nombre],
    );
    return fila;
  }

  async editarCategoria(usuarioId: string, recursoId: string, nombre: string, activa: boolean): Promise<ResultadoCatalogos | undefined> {
    const [fila] = await this.db.query(
      `UPDATE categorias SET nombre=$3,activa=$4 WHERE id=$2 AND $1::bigint IS NOT NULL RETURNING id,codigo,nombre,activa`,
      [usuarioId, recursoId, nombre, activa],
    );
    return fila;
  }

  async crearZona(usuarioId: string, nombre: string, tipo: string): Promise<ResultadoCatalogos | undefined> {
    const [fila] = await this.db.query(
      `INSERT INTO zonas (nombre,tipo) SELECT $2,$3 WHERE $1::bigint IS NOT NULL RETURNING id,nombre,tipo,activa`,
      [usuarioId, nombre, tipo],
    );
    return fila;
  }

  async editarZona(usuarioId: string, recursoId: string, nombre: string, activa: boolean): Promise<ResultadoCatalogos | undefined> {
    const [fila] = await this.db.query(
      `UPDATE zonas SET nombre=$3,activa=$4 WHERE id=$2 AND $1::bigint IS NOT NULL RETURNING id,nombre,tipo,activa`,
      [usuarioId, recursoId, nombre, activa],
    );
    return fila;
  }
}
