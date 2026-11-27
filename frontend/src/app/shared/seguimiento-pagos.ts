import { Servicio } from '../core/services/proyecto-api.service';

export interface SeguimientoPagos {
  total: number;
  pagado: number;
  porConfirmar: number;
  pendiente: number;
  porcentaje: number;
}

const centavos = (valor: string | number | null | undefined) => Math.round(Number(valor ?? 0) * 100);

export function seguimientoPagos(s: Servicio): SeguimientoPagos {
  const total = centavos(s.total_acordado);
  let pagado = 0;
  let porConfirmar = 0;
  for (const p of s.pagos) {
    if (p.estado === 'confirmado') pagado += centavos(p.monto);
    else if (p.estado === 'reportado') porConfirmar += centavos(p.monto);
  }
  return {
    total: total / 100,
    pagado: pagado / 100,
    porConfirmar: porConfirmar / 100,
    pendiente: Math.max(0, total - pagado - porConfirmar) / 100,
    porcentaje: total === 0 ? 0 : Math.min(100, Math.round((pagado / total) * 100)),
  };
}