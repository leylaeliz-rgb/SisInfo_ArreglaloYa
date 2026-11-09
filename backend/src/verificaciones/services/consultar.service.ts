import { VerificacionesRepository } from '../core/consulta.repository';

export class ConsultarVerificacionesService {
  constructor(private readonly repositorio: VerificacionesRepository) {}

  listar(usuarioId: string) {
    return this.repositorio.listar(usuarioId);
  }
}
