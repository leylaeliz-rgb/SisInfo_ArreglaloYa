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

  cancelarAntesDeIniciar(usuarioId: string, recursoId: string) {
    return this.repositorio.cancelarAntesDeIniciar(usuarioId, recursoId);
  }

  agendar(usuarioId: string, recursoId: string, fecha: string) {
    return this.repositorio.agendar(usuarioId, recursoId, fecha);
  }

  contacto(usuarioId: string, recursoId: string) {
    return this.repositorio.contacto(usuarioId, recursoId);
  }

  rechazarPrecio(usuarioId: string, recursoId: string, propuestaId: string) {
    return this.repositorio.rechazarPrecio(usuarioId, recursoId, propuestaId);
  }

  proponerIncremento(usuarioId: string, recursoId: string, manoObra: string, materiales: string, justificacion: string) {
    return this.repositorio.proponerIncremento(usuarioId, recursoId, manoObra, materiales, justificacion);
  }

  aceptarIncremento(usuarioId: string, recursoId: string, propuestaId: string) {
    return this.repositorio.aceptarIncremento(usuarioId, recursoId, propuestaId);
  }

  cancelarPorTrabajador(usuarioId: string, recursoId: string, motivo: string) {
    return this.repositorio.cancelarPorTrabajador(usuarioId, recursoId, motivo);
  }
}
