import { HttpErrorResponse } from '@angular/common/http';
import { Directive, inject, signal } from '@angular/core';
import { AuthService } from '../core/services/auth.service';
import { ProyectoApi } from '../core/services/proyecto-api.service';
import { mensajeError } from '../core/utils/errores';

@Directive()
export abstract class Pantalla {
  readonly auth = inject(AuthService);
  readonly api = inject(ProyectoApi);
  readonly ocupado = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');

  async realizar(operacion: () => Promise<unknown>, mensaje = 'Cambios guardados.') {
    if (this.ocupado()) return false;
    this.ocupado.set(true);
    this.error.set('');
    this.mensaje.set('');
    try {
      await operacion();
      this.mensaje.set(mensaje);
      return true;
    } catch (e) {
      this.error.set(e instanceof HttpErrorResponse ? mensajeError(e) : 'No se pudo completar la operación. Intenta nuevamente.');
      return false;
    } finally {
      this.ocupado.set(false);
    }
  }
}
