import { OperacionesSolicitudesRepository } from '../core/operaciones.repository';

export class OperacionesSolicitudesService {
  constructor(private readonly repositorio: OperacionesSolicitudesRepository) {}

  publicar(usuarioId: string, categoriaId: string, zonaId: string, titulo: string, descripcion: string, urgente: boolean) {
    return this.repositorio.publicar(usuarioId, categoriaId, zonaId, titulo, descripcion, urgente);
  }

  editar(usuarioId: string, recursoId: string, titulo: string, descripcion: string) {
    return this.repositorio.editar(usuarioId, recursoId, titulo, descripcion);
  }

  cancelar(usuarioId: string, recursoId: string, motivo: string) {
    return this.repositorio.cancelar(usuarioId, recursoId, motivo);
  }
}
