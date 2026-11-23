import { BadRequestException } from '@nestjs/common';
import { id } from '../../shared/api/validacion';

/** Si el campo no viene, devuelve undefined; si viene, lo valida. */
export function opcional<T>(validar: (valor: unknown) => T) {
  return (valor: unknown): T | undefined => (valor === undefined ? undefined : validar(valor));
}

export function codigoCategoria(valor: unknown): string {
  const codigo = typeof valor === 'string' ? valor.trim().toUpperCase() : '';
  if (!/^[A-Z0-9_]{2,40}$/.test(codigo)) {
    throw new BadRequestException(
      'El código debe tener de 2 a 40 caracteres: letras sin tilde, números o guion bajo.',
    );
  }
  return codigo;
}

/** undefined = no cambia, null = sin zona padre, texto = id de la zona padre. */
export function zonaPadre(valor: unknown): string | null | undefined {
  if (valor === undefined) return undefined;
  if (valor === null) return null;
  return id(valor);
}