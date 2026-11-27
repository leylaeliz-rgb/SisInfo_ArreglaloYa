import { PagoExcedeImporte } from './operaciones-pago';

export interface PagoSeguimiento {
  tipo: string;
  monto: string | number;
  estado: string;
}

export interface ResumenPagos {
  total: string;
  pagado: string;
  por_confirmar: string;
  pendiente: string;
  porcentaje_pagado: number;
  liquidado: boolean;
  excedido: boolean;
}

export function aCentavos(valor: string | number): number {
  const texto = String(valor).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(texto)) {
    throw new Error(`Importe inválido: "${texto}".`);
  }
  const [entero, decimales = ''] = texto.split('.');
  return Number(entero) * 100 + Number(decimales.padEnd(2, '0'));
}

export function deCentavos(centavos: number): string {
  const signo = centavos < 0 ? '-' : '';
  const absoluto = Math.abs(centavos);
  return `${signo}${Math.floor(absoluto / 100)}.${String(absoluto % 100).padStart(2, '0')}`;
}

function acumular(pagos: PagoSeguimiento[]) {
  let pagado = 0;
  let porConfirmar = 0;
  for (const pago of pagos) {
    if (pago.estado === 'confirmado') pagado += aCentavos(pago.monto);
    else if (pago.estado === 'reportado') porConfirmar += aCentavos(pago.monto);
  }
  return { pagado, porConfirmar };
}

export function pendienteEnCentavos(total: string | number, pagos: PagoSeguimiento[]): number {
  const { pagado, porConfirmar } = acumular(pagos);
  return Math.max(0, aCentavos(total) - pagado - porConfirmar);
}

export function calcularResumenPagos(total: string | number, pagos: PagoSeguimiento[]): ResumenPagos {
  const totalC = aCentavos(total);
  const { pagado, porConfirmar } = acumular(pagos);
  const comprometido = pagado + porConfirmar;
  const pendiente = Math.max(0, totalC - comprometido);

  return {
    total: deCentavos(totalC),
    pagado: deCentavos(pagado),
    por_confirmar: deCentavos(porConfirmar),
    pendiente: deCentavos(pendiente),
    porcentaje_pagado: totalC === 0 ? 0 : Math.round((pagado / totalC) * 10000) / 100,
    liquidado: totalC > 0 && pagado >= totalC,
    excedido: comprometido > totalC,
  };
}

export function validarNuevoPago(
  total: string | number,
  pagosExistentes: PagoSeguimiento[],
  montoNuevo: string | number,
): void {
  const monto = aCentavos(montoNuevo);
  const pendiente = pendienteEnCentavos(total, pagosExistentes);
  if (monto > pendiente) {
    throw new PagoExcedeImporte(
      `El pago de ${deCentavos(monto)} supera el saldo pendiente de ${deCentavos(pendiente)}.`,
    );
  }
}