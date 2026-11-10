import { OperacionesVerificacionesRepository } from '../core/operaciones.repository';

export class OperacionesVerificacionesService {
  constructor(private readonly repositorio: OperacionesVerificacionesRepository) {}

  solicitar(usuarioId: string) {
    return this.repositorio.solicitar(usuarioId);
  }

  decidir(usuarioId: string, recursoId: string, estado: string, motivo: string) {
    return this.repositorio.decidir(usuarioId, recursoId, estado, motivo);
  }

  retirarSolicitud(usuarioId: string, recursoId: string) {
    return this.repositorio.retirarSolicitud(usuarioId, recursoId);
  }

  registrarCriterio(usuarioId: string, recursoId: string, criterio: string, estado: string, observaciones: string) {
    return this.repositorio.registrarCriterio(usuarioId, recursoId, criterio, estado, observaciones);
  }
}
