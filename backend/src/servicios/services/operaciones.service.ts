import { OperacionesServiciosRepository } from '../core/operaciones.repository';

export class OperacionesServiciosService {
  constructor(private readonly repositorio: OperacionesServiciosRepository) {}

  contratar(usuarioId: string, recursoId: string) {
    return this.repositorio.contratar(usuarioId, recursoId);
  }

  finalizar(usuarioId: string, recursoId: string) {
    return this.repositorio.finalizar(usuarioId, recursoId);
  }

  proponerPrecio(usuarioId: string, recursoId: string, manoObra: string, materiales: string, transporte: string) {
    return this.repositorio.proponerPrecio(usuarioId, recursoId, manoObra, materiales, transporte);
  }

  aceptarPrecio(usuarioId: string, recursoId: string, propuestaId: string) {
    return this.repositorio.aceptarPrecio(usuarioId, recursoId, propuestaId);
  }

  iniciar(usuarioId: string, recursoId: string) {
    return this.repositorio.iniciar(usuarioId, recursoId);
  }
}
