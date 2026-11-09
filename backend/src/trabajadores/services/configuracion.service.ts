import { ConfiguracionTrabajadorRepository, Franja } from '../core/configuracion.repository';

export class ConfiguracionTrabajadorService {
  constructor(private readonly repositorio: ConfiguracionTrabajadorRepository) {}

  especialidades(usuarioId: string, ids: string[]) {
    return this.repositorio.especialidades(usuarioId, ids);
  }

  cobertura(usuarioId: string, ids: string[]) {
    return this.repositorio.cobertura(usuarioId, ids);
  }

  horarios(usuarioId: string, franjas: Franja[]) {
    return this.repositorio.horarios(usuarioId, franjas);
  }
}
