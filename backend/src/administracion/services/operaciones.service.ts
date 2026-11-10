import { OperacionesAdministracionRepository } from '../core/operaciones.repository';

export class OperacionesAdministracionService {
  constructor(private readonly repositorio: OperacionesAdministracionRepository) {}

  revocarSuspension(usuarioId: string, recursoId: string) {
    return this.repositorio.revocarSuspension(usuarioId, recursoId);
  }

  registrarIncidencia(usuarioId: string, trabajadorId: string, motivo: string) {
    return this.repositorio.registrarIncidencia(usuarioId, trabajadorId, motivo);
  }

  listarIncidencias() {
    return this.repositorio.listarIncidencias();
  }

  revisarIncidencia(usuarioId: string, incidenciaId: string, estado: string, observaciones: string) {
    return this.repositorio.revisarIncidencia(usuarioId, incidenciaId, estado, observaciones);
  }

  aplicarSuspension(usuarioId: string, incidenciaId: string) {
    return this.repositorio.aplicarSuspension(usuarioId, incidenciaId);
  }

  apelarVerificacion(usuarioId: string, recursoId: string, motivo: string) {
    return this.repositorio.apelarVerificacion(usuarioId, recursoId, motivo);
  }

  apelarSuspension(usuarioId: string, recursoId: string, motivo: string) {
    return this.repositorio.apelarSuspension(usuarioId, recursoId, motivo);
  }

  resolverApelacion(usuarioId: string, recursoId: string, estado: string, decision: string) {
    return this.repositorio.resolverApelacion(usuarioId, recursoId, estado, decision);
  }
}
