import { OperacionesUsuariosRepository } from '../core/operaciones.repository';

export class OperacionesUsuariosService {
  constructor(private readonly repositorio: OperacionesUsuariosRepository) {}

  actualizarPerfil(usuarioId: string, nombreCompleto: string) {
    return this.repositorio.actualizarPerfil(usuarioId, nombreCompleto);
  }

  desactivar(usuarioId: string) {
    return this.repositorio.desactivar(usuarioId);
  }

  inscribirseComoTrabajador(usuarioId: string) {
    return this.repositorio.inscribirseComoTrabajador(usuarioId);
  }

  aceptarTerminos(usuarioId: string, version: string, ip: string | null) {
    return this.repositorio.aceptarTerminos(usuarioId, version, ip);
  }

  terminosAceptados(usuarioId: string) {
    return this.repositorio.terminosAceptados(usuarioId);
  }
}
