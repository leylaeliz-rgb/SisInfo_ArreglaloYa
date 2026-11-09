import { AccionPago, OperacionesPagoRepository } from '../core/operaciones-pago';

export class RegistrarPagoService {
  constructor(private readonly pagos: OperacionesPagoRepository) {}

  ejecutar(servicioId: string, usuarioId: string, accion: AccionPago) {
    return this.pagos.ejecutar(servicioId, usuarioId, accion);
  }
}
