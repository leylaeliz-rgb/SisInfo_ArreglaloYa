import { OperacionesCatalogosRepository } from '../core/operaciones.repository';

export class OperacionesCatalogosService {
  constructor(private readonly repositorio: OperacionesCatalogosRepository) {}

  crearCategoria(usuarioId: string, codigo: string, nombre: string) {
    return this.repositorio.crearCategoria(usuarioId, codigo, nombre);
  }

  editarCategoria(usuarioId: string, recursoId: string, nombre: string, activa: boolean) {
    return this.repositorio.editarCategoria(usuarioId, recursoId, nombre, activa);
  }

  crearZona(usuarioId: string, nombre: string, tipo: string) {
    return this.repositorio.crearZona(usuarioId, nombre, tipo);
  }

  editarZona(usuarioId: string, recursoId: string, nombre: string, activa: boolean) {
    return this.repositorio.editarZona(usuarioId, recursoId, nombre, activa);
  }
}
