import { OperacionesAdministracionRepository } from '../core/operaciones.repository';

export class OperacionesAdministracionService {
  constructor(private readonly repositorio: OperacionesAdministracionRepository) {}

  revocarSuspension(usuarioId: string, recursoId: string) {
    return this.repositorio.revocarSuspension(usuarioId, recursoId);
  }
}
