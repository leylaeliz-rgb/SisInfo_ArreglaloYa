import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';

export function id(valor: unknown): string {
  if (typeof valor !== 'string' || !/^[1-9][0-9]{0,18}$/.test(valor) || BigInt(valor) > 9223372036854775807n) {
    throw new BadRequestException('El identificador debe ser un entero positivo en formato de texto.');
  }
  return valor;
}

export function texto(maximo: number) {
  return (valor: unknown): string => {
    if (typeof valor !== 'string' || !valor.trim() || valor.trim().length > maximo) {
      throw new BadRequestException(`Indica un texto de 1 a ${maximo} caracteres.`);
    }
    return valor.trim();
  };
}

export function entero(minimo: number, maximo: number) {
  return (valor: unknown): number => {
    if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < minimo || valor > maximo) {
      throw new BadRequestException(`Indica un entero entre ${minimo} y ${maximo}.`);
    }
    return valor;
  };
}

export function booleano(valor: unknown): boolean {
  if (typeof valor !== 'boolean') {
    throw new BadRequestException('Indica true o false.');
  }
  return valor;
}

export function importe(valor: unknown): string {
  if (typeof valor !== 'string' || !/^[0-9]{1,8}(\.[0-9]{1,2})?$/.test(valor)) {
    throw new BadRequestException('Envía el importe como texto, con hasta dos decimales.');
  }
  return valor;
}

export function opcion(...opciones: string[]) {
  return (valor: unknown): string => {
    if (typeof valor !== 'string' || !opciones.includes(valor)) {
      throw new BadRequestException(`Usa una de estas opciones: ${opciones.join(', ')}.`);
    }
    return valor;
  };
}

export function exigirRol(actual: string, requerido: string) {
  if (actual !== requerido) {
    throw new ForbiddenException(`Activa el rol ${requerido}.`);
  }
}

export async function resultado<T>(operacion: Promise<T | undefined>): Promise<T> {
  const fila = await operacion;
  if (!fila) {
    throw new ConflictException('La operación no está disponible con los datos o el estado actual.');
  }
  return fila;
}
