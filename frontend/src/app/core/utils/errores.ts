// core/utils/errores.ts
import { HttpErrorResponse } from '@angular/common/http';

export function mensajeError(e: HttpErrorResponse): string {
  if (e.status === 0) return 'No hay conexión con el servidor (¿backend apagado o CORS?).';
  const m = e.error?.message;
  return Array.isArray(m) ? m.join(', ') : (m ?? 'Ocurrió un error inesperado.');
}