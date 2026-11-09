import { OperacionesVerificacionesRepository } from '../core/operaciones.repository';

export class OperacionesVerificacionesService {
  constructor(private readonly repositorio: OperacionesVerificacionesRepository) {}

  solicitar(usuarioId: string) {
    return this.repositorio.solicitar(usuarioId);
  }

  decidir(usuarioId: string, recursoId: string, estado: string, motivo: string) {
    return this.repositorio.decidir(usuarioId, recursoId, estado, motivo);
  }
}
