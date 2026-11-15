import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { mensajeError } from '../../core/utils/errores';

@Component({
  selector: 'app-registro',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="tarjeta">
      <h1>Crear cuenta</h1>
      <form (ngSubmit)="registrar()">
        <label class="campo">Nombre completo
          <input name="nombre" [(ngModel)]="nombreCompleto" required maxlength="150" />
        </label>
        <label class="campo">Teléfono
          <input name="telefono" [(ngModel)]="telefono" required inputmode="tel" placeholder="70000000" />
        </label>
        <label class="campo">Contraseña (mínimo 8 caracteres)
          <input name="password" type="password" [(ngModel)]="password" required autocomplete="new-password" />
        </label>
        <label class="campo">Repetir contraseña
          <input name="confirmar" type="password" [(ngModel)]="confirmar" required autocomplete="new-password" />
        </label>
        <label class="campo">Quiero registrarme como
          <select name="rol" [(ngModel)]="rol">
            <option value="cliente">Cliente (busco servicios)</option>
            <option value="trabajador">Trabajador (ofrezco servicios)</option>
          </select>
        </label>
        @if (error()) { <p class="error">{{ error() }}</p> }
        <button class="btn" type="submit" [disabled]="cargando()">
          {{ cargando() ? 'Creando…' : 'Crear cuenta' }}
        </button>
      </form>
      <p>¿Ya tienes cuenta? <a routerLink="/login">Inicia sesión</a></p>
    </section>
  `,
})
export class Registro {
  private auth = inject(AuthService);
  private router = inject(Router);

  nombreCompleto = '';
  telefono = '';
  password = '';
  confirmar = '';
  rol: 'cliente' | 'trabajador' = 'cliente';

  error = signal('');
  cargando = signal(false);

  registrar() {
    const problema = this.validar();
    if (problema) {
      this.error.set(problema);
      return;
    }

    this.error.set('');
    this.cargando.set(true);
    const telefono = this.telefono.trim();

    this.auth
      .registrar({
        nombreCompleto: this.nombreCompleto.trim(),
        telefono,
        password: this.password,
        rol: this.rol,
      })
      .pipe(switchMap(() => this.auth.login({ telefono, password: this.password })))
      .subscribe({
        next: () => this.router.navigate(['/perfil']),
        error: (e) => {
          this.error.set(mensajeError(e));
          this.cargando.set(false);
        },
      });
  }

  private validar(): string | null {
    const nombre = this.nombreCompleto.trim();
    if (!nombre || nombre.length > 150) return 'Escribe tu nombre (máximo 150 caracteres).';
    if (!/^\+?[0-9]{7,19}$/.test(this.telefono.trim())) return 'El teléfono debe tener entre 7 y 19 dígitos.';
    if (this.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (this.password !== this.confirmar) return 'Las contraseñas no coinciden.';
    return null;
  }
}