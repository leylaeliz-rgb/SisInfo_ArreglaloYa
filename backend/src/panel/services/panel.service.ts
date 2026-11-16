import { ConsultaPanel, PanelRepository } from '../core/panel.repository';

export class PanelService {
  constructor(private readonly repositorio: PanelRepository) {}

  consultar(consulta: ConsultaPanel, usuarioId: string, administrador: boolean, rol: string, desde?: string, hasta?: string) {
    return this.repositorio.consultar(consulta, usuarioId, administrador, rol, desde, hasta);
  }
}
