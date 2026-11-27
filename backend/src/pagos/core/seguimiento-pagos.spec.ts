import { PagoExcedeImporte, PagoNoPermitido } from './operaciones-pago';
import {
  aCentavos, calcularResumenPagos, deCentavos, pendienteEnCentavos, validarNuevoPago,
} from './seguimiento-pagos';

const anticipo = (estado = 'confirmado', monto = '250.00') => ({ tipo: 'anticipo', monto, estado });
const saldo = (estado = 'reportado', monto = '750.00') => ({ tipo: 'saldo', monto, estado });

describe('importes en centavos', () => {
  it('convierte sin errores de coma flotante', () => {
    expect(aCentavos('0.10') + aCentavos('0.20')).toBe(30);
    expect(aCentavos('1234.5')).toBe(123450);
    expect(aCentavos(99)).toBe(9900);
    expect(deCentavos(123456)).toBe('1234.56');
    expect(deCentavos(5)).toBe('0.05');
  });

  it('rechaza importes inválidos', () => {
    expect(() => aCentavos('-5')).toThrow();
    expect(() => aCentavos('abc')).toThrow();
    expect(() => aCentavos('1.234')).toThrow();
  });
});

describe('calcularResumenPagos', () => {
  it('sin pagos: todo está pendiente', () => {
    expect(calcularResumenPagos('1000.00', [])).toEqual({
      total: '1000.00', pagado: '0.00', por_confirmar: '0.00', pendiente: '1000.00',
      porcentaje_pagado: 0, liquidado: false, excedido: false,
    });
  });

  it('con anticipo confirmado: queda el 75 %', () => {
    const r = calcularResumenPagos('1000.00', [anticipo()]);
    expect(r.pagado).toBe('250.00');
    expect(r.pendiente).toBe('750.00');
    expect(r.porcentaje_pagado).toBe(25);
  });

  it('saldo reportado cuenta como por confirmar, no como pagado', () => {
    const r = calcularResumenPagos('1000.00', [anticipo(), saldo('reportado')]);
    expect(r.pagado).toBe('250.00');
    expect(r.por_confirmar).toBe('750.00');
    expect(r.pendiente).toBe('0.00');
    expect(r.liquidado).toBe(false);
  });

  it('con todo confirmado queda liquidado', () => {
    const r = calcularResumenPagos('1000.00', [anticipo(), saldo('confirmado')]);
    expect(r.pagado).toBe('1000.00');
    expect(r.pendiente).toBe('0.00');
    expect(r.porcentaje_pagado).toBe(100);
    expect(r.liquidado).toBe(true);
  });

  it('ignora pagos revertidos, pendientes y observados', () => {
    const r = calcularResumenPagos('1000.00', [anticipo('revertido'), saldo('observado'), saldo('pendiente')]);
    expect(r.pagado).toBe('0.00');
    expect(r.pendiente).toBe('1000.00');
  });

  it('un aumento de precio vuelve a dejar saldo pendiente', () => {
    const r = calcularResumenPagos('1200.00', [anticipo()]);
    expect(r.pendiente).toBe('950.00');
  });

  it('nunca devuelve pendiente negativo y marca la inconsistencia', () => {
    const r = calcularResumenPagos('1000.00', [anticipo('confirmado', '1200.00')]);
    expect(r.pendiente).toBe('0.00');
    expect(r.excedido).toBe(true);
  });

  it('maneja decimales sin perder centavos', () => {
    const r = calcularResumenPagos('333.33', [anticipo('confirmado', '83.33')]);
    expect(r.pendiente).toBe('250.00');
  });
});

describe('validarNuevoPago', () => {
  it('permite un pago igual al saldo pendiente', () => {
    expect(() => validarNuevoPago('1000.00', [anticipo()], '750.00')).not.toThrow();
  });

  it('permite un pago menor al saldo pendiente', () => {
    expect(() => validarNuevoPago('1000.00', [anticipo()], '100.00')).not.toThrow();
  });

  it('rechaza un pago superior al saldo pendiente', () => {
    expect(() => validarNuevoPago('1000.00', [anticipo()], '750.01')).toThrow(PagoExcedeImporte);
  });

  it('rechaza un pago si el saldo ya está reportado', () => {
    expect(() => validarNuevoPago('1000.00', [anticipo(), saldo('reportado')], '1.00')).toThrow(PagoExcedeImporte);
  });

  it('rechaza un pago si ya está todo pagado', () => {
    expect(() => validarNuevoPago('1000.00', [anticipo(), saldo('confirmado')], '0.01')).toThrow(PagoExcedeImporte);
  });

  it('permite volver a pagar si el anticipo fue revertido', () => {
    expect(() => validarNuevoPago('1000.00', [anticipo('revertido')], '250.00')).not.toThrow();
  });

  it('el error se traduce como PagoNoPermitido (409) e informa los importes', () => {
    try {
      validarNuevoPago('1000.00', [anticipo()], '900.00');
      throw new Error('debía fallar');
    } catch (e) {
      expect(e).toBeInstanceOf(PagoNoPermitido);
      expect((e as Error).message).toContain('900.00');
      expect((e as Error).message).toContain('750.00');
    }
  });

  it('pendienteEnCentavos coincide con el resumen', () => {
    expect(pendienteEnCentavos('1000.00', [anticipo()])).toBe(75000);
  });
});