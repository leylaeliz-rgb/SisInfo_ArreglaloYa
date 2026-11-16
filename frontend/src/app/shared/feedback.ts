import { Component, input } from '@angular/core';

@Component({
  selector: 'app-feedback',
  template: `
    @if (error()) { <p class="alerta error" role="alert">{{ error() }}</p> }
    @if (mensaje()) { <p class="alerta exito" role="status">{{ mensaje() }}</p> }
    @if (ocupado()) { <p class="ayuda" role="status">Procesando…</p> }
  `,
})
export class Feedback {
  error = input('');
  mensaje = input('');
  ocupado = input(false);
}
