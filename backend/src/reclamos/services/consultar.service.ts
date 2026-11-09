import { ReclamosRepository } from '../core/consulta.repository';

export class ConsultarReclamosService {
  constructor(private readonly repositorio: ReclamosRepository) {}

  listar(usuarioId: string) {
    return this.repositorio.listar(usuarioId);
  }
}
