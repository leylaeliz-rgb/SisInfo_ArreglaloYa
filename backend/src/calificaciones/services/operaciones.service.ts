import { OperacionesCalificacionesRepository } from '../core/operaciones.repository';

export class OperacionesCalificacionesService {
  constructor(private readonly repositorio: OperacionesCalificacionesRepository) {}

  guardar(usuarioId: string, recursoId: string, estrellas: number, comentario: string) {
    return this.repositorio.guardar(usuarioId, recursoId, estrellas, comentario);
  }

  retirar(usuarioId: string, recursoId: string) {
    return this.repositorio.retirar(usuarioId, recursoId);
  }

  reputacion(usuarioId: string, recursoId: string) {
    return this.repositorio.reputacion(usuarioId, recursoId);
  }

  evaluarCliente(usuarioId: string, recursoId: string, valoracion: number, descripcion: string) {
    return this.repositorio.evaluarCliente(usuarioId, recursoId, valoracion, descripcion);
  }

  referenciasCliente(usuarioId: string, recursoId: string) {
    return this.repositorio.referenciasCliente(usuarioId, recursoId);
  }
}
