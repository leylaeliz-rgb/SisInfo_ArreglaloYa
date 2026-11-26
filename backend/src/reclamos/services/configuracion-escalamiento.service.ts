
import {
  ConfiguracionEscalamientoRepository,
} from '../core/configuracion-escalamiento.repository';

export class ConfiguracionEscalamientoService {

  constructor(
    private readonly repositorio:
      ConfiguracionEscalamientoRepository
  ) {}

  obtener() {
    return this.repositorio.obtener();
  }

  actualizar(
    usuarioId: string,
    plazoHoras: number
  ) {
    return this.repositorio.actualizar(
      usuarioId,
      plazoHoras
    );
  }

}
