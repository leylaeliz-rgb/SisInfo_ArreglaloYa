import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { mensajeError } from '../../core/utils/errores';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="tarjeta">
      <h1>Iniciar sesión</h1>
      <form (ngSubmit)="entrar()">
        <label class="campo">Teléfono
          <input name="telefono" [(ngModel)]="telefono" required inputmode="tel" autocomplete="username" />
        </label>
        <label class="campo">Contraseña
          <input name="password" type="password" [(ngModel)]="password" required autocomplete="current-password" />
        </label>
        @if (error()) { <p class="error">{{ error() }}</p> }
        <button class="btn" type="submit" [disabled]="cargando()">
          {{ cargando() ? 'Entrando…' : 'Entrar' }}
        </button>
      </form>
      <p>¿No tienes cuenta? <a routerLink="/registro">Regístrate</a></p>
    </section>
  `,
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);

  telefono = '';
  password = '';
  error = signal('');
  cargando = signal(false);

  entrar() {
    this.error.set('');
    this.cargando.set(true);
    this.auth.login({ telefono: this.telefono.trim(), password: this.password }).subscribe({
      next: () => this.router.navigate(['/perfil']),
      error: (e) => {
        this.error.set(mensajeError(e));
        this.cargando.set(false);
      },
    });
  }
}