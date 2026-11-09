import { ServiciosRepository } from '../core/consulta.repository';

export class ConsultarServiciosService {
  constructor(private readonly repositorio: ServiciosRepository) {}

  listar(usuarioId: string) {
    return this.repositorio.listar(usuarioId);
  }
}
