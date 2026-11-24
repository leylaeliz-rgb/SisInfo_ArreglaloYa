import { BadRequestException } from '@nestjs/common';
import type { CategoriaAdmin, ZonaAdmin } from '../core/catalogos.repository';
import type {
  CambiosCategoria,
  CambiosZona,
  DatosCategoria,
  DatosZona,
  OperacionesCatalogosRepository,
} from '../core/operaciones.repository';

function exigirCambios(cambios: object): void {
  if (Object.values(cambios).every((valor) => valor === undefined)) {
    throw new BadRequestException('Indica al menos un campo para modificar.');
  }
}

export class OperacionesCatalogosService {
  constructor(private readonly repositorio: OperacionesCatalogosRepository) {}

  crearCategoria(usuarioId: string, datos: DatosCategoria): Promise<CategoriaAdmin> {
    return this.repositorio.crearCategoria(usuarioId, datos);
  }

  editarCategoria(usuarioId: string, recursoId: string, cambios: CambiosCategoria): Promise<CategoriaAdmin> {
    exigirCambios(cambios);
    return this.repositorio.editarCategoria(usuarioId, recursoId, cambios);
  }

  crearZona(usuarioId: string, datos: DatosZona): Promise<ZonaAdmin> {
    return this.repositorio.crearZona(usuarioId, datos);
  }

  editarZona(usuarioId: string, recursoId: string, cambios: CambiosZona): Promise<ZonaAdmin> {
    exigirCambios(cambios);
    return this.repositorio.editarZona(usuarioId, recursoId, cambios);
  }
}