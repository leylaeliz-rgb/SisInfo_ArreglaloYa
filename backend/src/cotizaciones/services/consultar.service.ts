import { CotizacionesRepository } from '../core/consulta.repository';

export class ConsultarCotizacionesService {
  constructor(private readonly repositorio: CotizacionesRepository) {}

  listar(usuarioId: string) {
    return this.repositorio.listar(usuarioId);
  }
}
