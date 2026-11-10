import { OperacionesCotizacionesRepository } from '../core/operaciones.repository';

export class OperacionesCotizacionesService {
  constructor(private readonly repositorio: OperacionesCotizacionesRepository) {}

  enviar(usuarioId: string, recursoId: string, manoObra: string, materiales: string, transporte: string, requiereVisita: boolean) {
    return this.repositorio.enviar(usuarioId, recursoId, manoObra, materiales, transporte, requiereVisita);
  }

  retirar(usuarioId: string, recursoId: string) {
    return this.repositorio.retirar(usuarioId, recursoId);
  }

  editarCondiciones(usuarioId: string, recursoId: string, condiciones: string) {
    return this.repositorio.editarCondiciones(usuarioId, recursoId, condiciones);
  }
}
