import { DatosResumenServicio, PagosRepository } from '../core/consulta.repository';
import { ServicioInaccesible } from '../core/operaciones-pago';
import { ConsultarPagosService } from './consultar.service';

// Repositorio falso en memoria: no usa base de datos.
function repositorioCon(datos: DatosResumenServicio | undefined): PagosRepository {
  return {
    listar: async () => [],
    resumenServicio: async () => datos,
  };
}

describe('ConsultarPagosService.resumen', () => {
  it('calcula total, pagado, por confirmar y pendiente', async () => {
    const servicio = new ConsultarPagosService(repositorioCon({
      total: '1000.00',
      moneda: 'BOB',
      pagos: [
        { id: '1', tipo: 'anticipo', monto: '250.00', metodo: 'qr_simulado', estado: 'confirmado' },
        { id: '2', tipo: 'saldo', monto: '750.00', metodo: 'efectivo', estado: 'reportado' },
      ],
    }));

    const r = await servicio.resumen('10', '5');

    expect(r.servicio_id).toBe('10');
    expect(r.precio_acordado).toBe(true);
    expect(r.total).toBe('1000.00');
    expect(r.pagado).toBe('250.00');
    expect(r.por_confirmar).toBe('750.00');
    expect(r.pendiente).toBe('0.00');
    expect(r.pagos.length).toBe(2);
  });

  it('un servicio sin precio acordado devuelve ceros', async () => {
    const servicio = new ConsultarPagosService(repositorioCon({ total: null, moneda: 'BOB', pagos: [] }));

    const r = await servicio.resumen('10', '5');

    expect(r.precio_acordado).toBe(false);
    expect(r.total).toBe('0.00');
    expect(r.pendiente).toBe('0.00');
  });

  it('un pago revertido no cuenta como pagado', async () => {
    const servicio = new ConsultarPagosService(repositorioCon({
      total: '400.00',
      moneda: 'BOB',
      pagos: [{ id: '1', tipo: 'anticipo', monto: '100.00', metodo: 'qr_simulado', estado: 'revertido' }],
    }));

    const r = await servicio.resumen('10', '5');

    expect(r.pagado).toBe('0.00');
    expect(r.pendiente).toBe('400.00');
  });

  it('si el usuario no participa en el servicio lanza ServicioInaccesible', async () => {
    const servicio = new ConsultarPagosService(repositorioCon(undefined));

    await expect(servicio.resumen('10', '99')).rejects.toThrow(ServicioInaccesible);
  });
});