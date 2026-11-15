// features/usuarios/perfil.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Cuenta } from '../../core/models/auth.models';
import { AuthService } from '../../core/services/auth.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { mensajeError } from '../../core/utils/errores';

@Component({
  selector: 'app-perfil',
  imports: [RouterLink],
  template: `
    @if (cuenta(); as c) {
      <h2>{{ c.nombreCompleto }}</h2>
      <p>Teléfono: {{ c.telefono }}</p>
      <p>Roles: {{ c.roles.join(', ') }} | Activo: {{ auth.rolActivo() }}</p>

      @if (c.roles.includes('administrador')) {
        <button (click)="pasarAAdmin()">Entrar como administrador</button>
        <a routerLink="/admin">Panel admin</a>
      }
    }
    @if (error()) { <p style="color:red">{{ error() }}</p> }
    <button (click)="salir()">Cerrar sesión</button>
  `,
})
export class Perfil implements OnInit {
  auth = inject(AuthService);
  private usuarios = inject(UsuariosService);
  private router = inject(Router);

  cuenta = signal<Cuenta | null>(null);
  error = signal('');

  ngOnInit() {
    this.usuarios.consultar().subscribe({
      next: (c) => this.cuenta.set(c),
      error: (e) => this.error.set(mensajeError(e)),
    });
  }

  pasarAAdmin() {
    this.auth.cambiarRol('administrador').subscribe({
      next: () => this.router.navigate(['/admin']),
      error: (e) => this.error.set(mensajeError(e)),
    });
  }

  salir() {
    this.auth.logout().subscribe({
      complete: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}