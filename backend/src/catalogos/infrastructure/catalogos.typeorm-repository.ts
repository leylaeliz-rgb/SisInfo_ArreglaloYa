import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CatalogosRepository, Categoria, Zona } from '../core/catalogos.repository';

@Injectable()
export class CatalogosTypeOrmRepository implements CatalogosRepository {
  constructor(private readonly dataSource: DataSource) {}

  listarCategorias(): Promise<Categoria[]> {
    return this.dataSource.query(
      'SELECT id::text, codigo, nombre, descripcion FROM categorias WHERE activa ORDER BY nombre, id',
    );
  }

  listarZonas(): Promise<Zona[]> {
    return this.dataSource.query(
      'SELECT id::text, nombre, tipo, zona_padre_id::text AS "zonaPadreId" FROM zonas WHERE activa ORDER BY nombre, id',
    );
  }
}
