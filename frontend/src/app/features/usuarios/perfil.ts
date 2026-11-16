import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Cuenta, Rol } from '../../core/models/auth.models';
import { AuthService } from '../../core/services/auth.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { mensajeError } from '../../core/utils/errores';

@Component({
  selector: 'app-perfil',
  imports: [FormsModule],
  template: `
    @if (cuenta(); as c) {
      <section class="tarjeta">
        <h1>Mi perfil</h1>
        <p><b>Teléfono:</b> {{ c.telefono }}</p>

        <form (ngSubmit)="guardarNombre()">
          <label class="campo">Nombre completo
            <input name="nombre" [(ngModel)]="nombre" required maxlength="150" />
          </label>
          <button class="btn" type="submit">Guardar nombre</button>
        </form>
      </section>

      <section class="tarjeta">
        <h2>Mis roles</h2>
        <button type="button" class="btn-sec" (click)="cargar()" [disabled]="cargando()">
          {{ cargando() ? 'Consultando roles…' : 'Actualizar perfil y roles' }}
        </button>
        <p>Elige con qué rol quieres usar la aplicación:</p>
        <div class="fila">
          @for (r of c.roles; track r) {
            <button class="btn-sec" [class.activo]="r === auth.rolActivo()" (click)="cambiarRol(r)">
              {{ r }}
            </button>
          }
        </div>

        @if (!c.roles.includes('trabajador')) {
          <p>¿Quieres ofrecer tus servicios?</p>
          <button class="btn-sec" (click)="hacerseTrabajador()">Inscribirme como trabajador</button>
        }
      </section>

      <section class="tarjeta">
        <h2>Zona de peligro</h2>
        <p>Al desactivar tu cuenta ya no podrás iniciar sesión.</p>
        <button class="btn-peligro" (click)="desactivar()">Desactivar mi cuenta</button>
      </section>
    }

    @if (mensaje()) { <p class="exito">{{ mensaje() }}</p> }
    @if (error()) { <p class="error">{{ error() }}</p> }
  `,
})
export class Perfil implements OnInit {
  auth = inject(AuthService);
  private usuarios = inject(UsuariosService);
  private router = inject(Router);

  cuenta = signal<Cuenta | null>(null);
  nombre = '';
  mensaje = signal('');
  error = signal('');
  cargando = signal(false);

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    if (this.cargando()) return;
    this.cargando.set(true);
    this.error.set('');
    this.usuarios.consultar().subscribe({
      next: (c) => {
        this.cuenta.set(c);
        this.nombre = c.nombreCompleto;
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeError(e));
        this.cargando.set(false);
      },
    });
  }

  guardarNombre() {
    this.limpiar();
    this.usuarios.actualizarPerfil(this.nombre.trim()).subscribe({
      next: () => {
        this.mensaje.set('Nombre actualizado.');
        this.cargar();
      },
      error: (e) => this.error.set(mensajeError(e)),
    });
  }

  cambiarRol(rol: Rol) {
    this.limpiar();
    this.auth.cambiarRol(rol).subscribe({
      next: () => this.mensaje.set(`Ahora usas la aplicación como ${rol}.`),
      error: (e) => this.error.set(mensajeError(e)),
    });
  }

  hacerseTrabajador() {
    this.limpiar();
    this.usuarios.inscribirseComoTrabajador().subscribe({
      next: () => {
        this.mensaje.set('Ya eres trabajador. Puedes cambiar a ese rol arriba.');
        this.cargar();
      },
      error: (e) => this.error.set(mensajeError(e)),
    });
  }

  desactivar() {
    if (!confirm('¿Seguro que quieres desactivar tu cuenta?')) return;
    this.limpiar();
    this.usuarios.desactivar().subscribe({
      next: () => {
        this.auth.limpiarSesion();
        this.router.navigate(['/login']);
      },
      error: (e) => this.error.set(mensajeError(e)),
    });
  }

  private limpiar() {
    this.mensaje.set('');
    this.error.set('');
  }
}
