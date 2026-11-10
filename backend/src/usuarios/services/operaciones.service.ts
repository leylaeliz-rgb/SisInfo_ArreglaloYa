import { OperacionesUsuariosRepository } from '../core/operaciones.repository';

export class OperacionesUsuariosService {
  constructor(private readonly repositorio: OperacionesUsuariosRepository) {}

  actualizarPerfil(usuarioId: string, nombreCompleto: string) {
    return this.repositorio.actualizarPerfil(usuarioId, nombreCompleto);
  }

  desactivar(usuarioId: string) {
    return this.repositorio.desactivar(usuarioId);
  }
}
