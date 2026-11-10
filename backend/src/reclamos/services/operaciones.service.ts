import { OperacionesReclamosRepository } from '../core/operaciones.repository';

export class OperacionesReclamosService {
  constructor(private readonly repositorio: OperacionesReclamosRepository) {}

  presentar(usuarioId: string, recursoId: string, descripcion: string, tipo: string) {
    return this.repositorio.presentar(usuarioId, recursoId, descripcion, tipo);
  }

  resolver(usuarioId: string, recursoId: string, estado: string, resultado: string) {
    return this.repositorio.resolver(usuarioId, recursoId, estado, resultado);
  }

  retirar(usuarioId: string, recursoId: string) {
    return this.repositorio.retirar(usuarioId, recursoId);
  }
}
