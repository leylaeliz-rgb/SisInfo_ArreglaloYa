import { OperacionesCalificacionesRepository } from '../core/operaciones.repository';

export class OperacionesCalificacionesService {
  constructor(private readonly repositorio: OperacionesCalificacionesRepository) {}

  guardar(usuarioId: string, recursoId: string, estrellas: number, comentario: string) {
    return this.repositorio.guardar(usuarioId, recursoId, estrellas, comentario);
  }
}
