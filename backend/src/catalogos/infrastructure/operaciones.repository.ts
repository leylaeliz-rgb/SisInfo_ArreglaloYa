import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import type { CategoriaAdmin, ZonaAdmin } from '../core/catalogos.repository';
import type {
  CambiosCategoria,
  CambiosZona,
  DatosCategoria,
  DatosZona,
  OperacionesCatalogosRepository,
  TipoZona,
} from '../core/operaciones.repository';

const COLUMNAS_CATEGORIA = 'id::text AS id, codigo, nombre, descripcion, activa';
const COLUMNAS_ZONA = `id::text AS id, nombre, tipo, zona_padre_id::text AS "zonaPadreId", activa`;

/** Un hijo solo puede depender de un nivel superior: esto evita ciclos. */
const NIVEL: Record<TipoZona, number> = { otb: 1, zona: 2, macrodistrito: 3 };

function esDuplicado(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';
}

function restriccionDe(error: unknown): string {
  return (error as { constraint?: string }).constraint ?? '';
}

function accionDe(antes: { activa: boolean }, despues: { activa: boolean }): string {
  const soloEstado =
    antes.activa !== despues.activa &&
    JSON.stringify({ ...antes, activa: 0 }) === JSON.stringify({ ...despues, activa: 0 });
  if (!soloEstado) return 'editar';
  return despues.activa ? 'activar' : 'desactivar';
}

@Injectable()
export class OperacionesCatalogosTypeOrmRepository implements OperacionesCatalogosRepository {
  private readonly log = new Logger('AuditoriaCatalogos');

  constructor(private readonly db: DataSource) {}

  crearCategoria(usuarioId: string, datos: DatosCategoria): Promise<CategoriaAdmin> {
    return this.ejecutar(
      () =>
        this.db.transaction(async (m) => {
          await this.exigirCategoriaLibre(m, datos.nombre, null);
          const [categoria] = await m.query(
            `INSERT INTO categorias (codigo, nombre, descripcion)
             VALUES ($1, $2, $3) RETURNING ${COLUMNAS_CATEGORIA}`,
            [datos.codigo, datos.nombre, datos.descripcion ?? null],
          );
          this.auditar(usuarioId, 'categoria', categoria.id, 'crear', null, categoria);
          return categoria as CategoriaAdmin;
        }),
      (restriccion) =>
        restriccion.includes('codigo')
          ? 'Ya existe una categoría con ese código.'
          : 'Ya existe una categoría con ese nombre.',
    );
  }

  editarCategoria(usuarioId: string, recursoId: string, cambios: CambiosCategoria): Promise<CategoriaAdmin> {
    return this.ejecutar(
      () =>
        this.db.transaction(async (m) => {
          const [antes] = await m.query(
            `SELECT ${COLUMNAS_CATEGORIA} FROM categorias WHERE id = $1::bigint FOR UPDATE`,
            [recursoId],
          );
          if (!antes) throw new NotFoundException('La categoría no existe.');

          const despues: CategoriaAdmin = {
            ...antes,
            nombre: cambios.nombre ?? antes.nombre,
            descripcion: cambios.descripcion ?? antes.descripcion,
            activa: cambios.activa ?? antes.activa,
          };
          if (JSON.stringify(antes) === JSON.stringify(despues)) return antes as CategoriaAdmin;

          await this.exigirCategoriaLibre(m, despues.nombre, recursoId);
          await m.query(
            'UPDATE categorias SET nombre = $2, descripcion = $3, activa = $4 WHERE id = $1::bigint',
            [recursoId, despues.nombre, despues.descripcion, despues.activa],
          );
          this.auditar(usuarioId, 'categoria', recursoId, accionDe(antes, despues), antes, despues);
          return despues;
        }),
      () => 'Ya existe una categoría con ese nombre.',
    );
  }

  crearZona(usuarioId: string, datos: DatosZona): Promise<ZonaAdmin> {
    return this.ejecutar(
      () =>
        this.db.transaction(async (m) => {
          const padreId = datos.zonaPadreId ?? null;
          await this.validarPadre(m, datos.tipo, padreId);
          await this.exigirZonaLibre(m, datos.nombre, padreId, null);
          const [zona] = await m.query(
            `INSERT INTO zonas (nombre, tipo, zona_padre_id)
             VALUES ($1, $2, $3::bigint) RETURNING ${COLUMNAS_ZONA}`,
            [datos.nombre, datos.tipo, padreId],
          );
          this.auditar(usuarioId, 'zona', zona.id, 'crear', null, zona);
          return zona as ZonaAdmin;
        }),
      () => 'Ya existe una zona con ese nombre en el mismo nivel.',
    );
  }

  editarZona(usuarioId: string, recursoId: string, cambios: CambiosZona): Promise<ZonaAdmin> {
    return this.ejecutar(
      () =>
        this.db.transaction(async (m) => {
          const [antes] = await m.query(
            `SELECT ${COLUMNAS_ZONA} FROM zonas WHERE id = $1::bigint FOR UPDATE`,
            [recursoId],
          );
          if (!antes) throw new NotFoundException('La zona no existe.');

          const despues: ZonaAdmin = {
            ...antes,
            nombre: cambios.nombre ?? antes.nombre,
            zonaPadreId: cambios.zonaPadreId === undefined ? antes.zonaPadreId : cambios.zonaPadreId,
            activa: cambios.activa ?? antes.activa,
          };
          if (JSON.stringify(antes) === JSON.stringify(despues)) return antes as ZonaAdmin;

          const cambiaPadre = despues.zonaPadreId !== antes.zonaPadreId;
          const seReactiva = despues.activa && !antes.activa;
          if (cambiaPadre || seReactiva) {
            await this.validarPadre(m, despues.tipo as TipoZona, despues.zonaPadreId);
          }

          if (antes.activa && !despues.activa) {
            const hijas = await m.query(
              'SELECT 1 FROM zonas WHERE zona_padre_id = $1::bigint AND activa LIMIT 1',
              [recursoId],
            );
            if (hijas.length > 0) {
              throw new ConflictException(
                'No se puede desactivar una zona que tiene subzonas activas. Desactiva primero las subzonas.',
              );
            }
          }

          await this.exigirZonaLibre(m, despues.nombre, despues.zonaPadreId, recursoId);
          await m.query(
            'UPDATE zonas SET nombre = $2, zona_padre_id = $3::bigint, activa = $4 WHERE id = $1::bigint',
            [recursoId, despues.nombre, despues.zonaPadreId, despues.activa],
          );
          this.auditar(usuarioId, 'zona', recursoId, accionDe(antes, despues), antes, despues);
          return despues;
        }),
      () => 'Ya existe una zona con ese nombre en el mismo nivel.',
    );
  }

  private async exigirCategoriaLibre(m: EntityManager, nombre: string, propiaId: string | null): Promise<void> {
    const filas = await m.query(
      'SELECT 1 FROM categorias WHERE lower(nombre) = lower($1) AND id <> COALESCE($2::bigint, 0) LIMIT 1',
      [nombre, propiaId],
    );
    if (filas.length > 0) throw new ConflictException('Ya existe una categoría con ese nombre.');
  }

  private async exigirZonaLibre(
    m: EntityManager,
    nombre: string,
    padreId: string | null,
    propiaId: string | null,
  ): Promise<void> {
    const filas = await m.query(
      `SELECT 1 FROM zonas
        WHERE lower(nombre) = lower($1)
          AND zona_padre_id IS NOT DISTINCT FROM $2::bigint
          AND id <> COALESCE($3::bigint, 0) LIMIT 1`,
      [nombre, padreId, propiaId],
    );
    if (filas.length > 0) throw new ConflictException('Ya existe una zona con ese nombre en el mismo nivel.');
  }

  private async validarPadre(m: EntityManager, tipo: TipoZona, padreId: string | null): Promise<void> {
    if (padreId === null) return;
    if (tipo === 'macrodistrito') {
      throw new BadRequestException('Un macrodistrito no puede depender de otra zona.');
    }
    const [padre] = await m.query('SELECT tipo, activa FROM zonas WHERE id = $1::bigint FOR SHARE', [padreId]);
    if (!padre) throw new BadRequestException('La zona padre indicada no existe.');
    if (!padre.activa) throw new ConflictException('La zona padre está desactivada.');
    if (NIVEL[padre.tipo as TipoZona] <= NIVEL[tipo]) {
      throw new BadRequestException(`Un elemento de tipo ${tipo} no puede depender de uno de tipo ${padre.tipo}.`);
    }
  }

  /** Sin tabla de auditoría, el registro queda en el log del servidor. */
  private auditar(
    usuarioId: string,
    entidad: 'categoria' | 'zona',
    entidadId: string,
    accion: string,
    antes: object | null,
    despues: object,
  ): void {
    this.log.log(JSON.stringify({ usuarioId, entidad, entidadId, accion, antes, despues }));
  }

  private async ejecutar<T>(operacion: () => Promise<T>, mensajeDuplicado: (restriccion: string) => string): Promise<T> {
    try {
      return await operacion();
    } catch (error) {
      if (esDuplicado(error)) throw new ConflictException(mensajeDuplicado(restriccionDe(error)));
      throw error;
    }
  }
}