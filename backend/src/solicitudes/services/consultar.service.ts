import { SolicitudesRepository } from '../core/consulta.repository';

export class ConsultarSolicitudesService {
  constructor(private readonly repositorio: SolicitudesRepository) {}

  listar(usuarioId: string) {
    return this.repositorio.listar(usuarioId);
  }
}
