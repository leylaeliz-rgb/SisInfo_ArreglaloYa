import { CalificacionesRepository } from '../core/consulta.repository';

export class ConsultarCalificacionesService {
  constructor(private readonly repositorio: CalificacionesRepository) {}

  listar(usuarioId: string) {
    return this.repositorio.listar(usuarioId);
  }
}
