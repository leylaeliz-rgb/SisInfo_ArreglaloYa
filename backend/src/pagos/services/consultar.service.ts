import { PagosRepository } from '../core/consulta.repository';
import { ServicioInaccesible } from '../core/operaciones-pago';
import { calcularResumenPagos } from '../core/seguimiento-pagos';

export class ConsultarPagosService {
  constructor(private readonly repositorio: PagosRepository) {}

  listar(usuarioId: string) {
    return this.repositorio.listar(usuarioId);
  }

  async resumen(servicioId: string, usuarioId: string) {
    const datos = await this.repositorio.resumenServicio(servicioId, usuarioId);
    if (!datos) throw new ServicioInaccesible('No se encontró el servicio.');

    return {
      servicio_id: servicioId,
      moneda: datos.moneda,
      precio_acordado: datos.total !== null,
      ...calcularResumenPagos(datos.total ?? '0', datos.pagos),
      pagos: datos.pagos,
    };
  }
}
