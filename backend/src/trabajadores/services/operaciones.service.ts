import { OperacionesTrabajadoresRepository } from '../core/operaciones.repository';

export class OperacionesTrabajadoresService {
  constructor(private readonly repositorio: OperacionesTrabajadoresRepository) {}

  cambiarDisponibilidad(usuarioId: string, disponible: boolean) {
    return this.repositorio.cambiarDisponibilidad(usuarioId, disponible);
  }

  retirarPerfil(usuarioId: string) {
    return this.repositorio.retirarPerfil(usuarioId);
  }

  buscar(usuarioId: string) {
    return this.repositorio.buscar(usuarioId);
  }

  pausar(usuarioId: string, dias: number) {
    return this.repositorio.pausar(usuarioId, dias);
  }

  reactivar(usuarioId: string) {
    return this.repositorio.reactivar(usuarioId);
  }
}
