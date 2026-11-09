import { PagosRepository } from '../core/consulta.repository';

export class ConsultarPagosService {
  constructor(private readonly repositorio: PagosRepository) {}

  listar(usuarioId: string) {
    return this.repositorio.listar(usuarioId);
  }
}
