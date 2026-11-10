export type MetodoSaldo = 'efectivo' | 'qr_acordado';
export type AccionPago =
  | { tipo: 'anticipo' }
  | { tipo: 'reportar-saldo'; metodo: MetodoSaldo }
  | { tipo: 'confirmar-saldo' }
  | { tipo: 'revertir-anticipo'; motivo: string };

export interface PagoRegistrado {
  id: string;
  servicio_id: string;
  tipo: 'anticipo' | 'saldo';
  monto: string;
  moneda: string;
  metodo: string;
  estado: string;
}

export class ServicioInaccesible extends Error {}
export class PagoNoPermitido extends Error {}

export interface OperacionesPagoRepository {
  ejecutar(servicioId: string, usuarioId: string, accion: AccionPago): Promise<PagoRegistrado>;
}
