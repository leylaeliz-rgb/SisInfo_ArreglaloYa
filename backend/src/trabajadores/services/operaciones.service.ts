import { OperacionesTrabajadoresRepository } from '../core/operaciones.repository';

export class OperacionesTrabajadoresService {
  constructor(private readonly repositorio: OperacionesTrabajadoresRepository) {}

  cambiarDisponibilidad(usuarioId: string, disponible: boolean) {
    return this.repositorio.cambiarDisponibilidad(usuarioId, disponible);
  }
}
