import { PagoSeguimiento } from './seguimiento-pagos';

export interface DatosResumenServicio {
  total: string | null;
  moneda: string;
  pagos: (PagoSeguimiento & { id: string; metodo: string })[];
}

export interface PagosRepository {
  listar(usuarioId: string): Promise<Record<string, unknown>[]>;
  resumenServicio(servicioId: string, usuarioId: string): Promise<DatosResumenServicio | undefined>;
}
