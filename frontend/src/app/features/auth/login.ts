// features/auth/login.ts
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { mensajeError } from '../../core/utils/errores';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <h2>Iniciar sesión</h2>
    <input [(ngModel)]="telefono" placeholder="Teléfono" />
    <input [(ngModel)]="password" type="password" placeholder="Contraseña" />
    <button (click)="entrar()">Entrar</button>
    @if (error()) { <p style="color:red">{{ error() }}</p> }
  `,
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);

  telefono = '';
  password = '';
  error = signal('');

  entrar() {
    this.auth.login({ telefono: this.telefono, password: this.password }).subscribe({
      next: () => this.router.navigate(['/perfil']),
      error: (e) => this.error.set(mensajeError(e)),
    });
  }
}