// features/administracion/suspensiones.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { Suspension } from '../../core/models/administracion.models';
import { AdministracionService } from '../../core/services/administracion.service';
import { mensajeError } from '../../core/utils/errores';

@Component({
  selector: 'app-suspensiones',
  template: `
    <h2>Suspensiones</h2>
    @if (error()) { <p style="color:red">{{ error() }}</p> }
    <table>
      <tr><th>ID</th><th>Trabajador</th><th>Motivo</th><th>Estado</th><th></th></tr>
      @for (s of suspensiones(); track s.id) {
        <tr>
          <td>{{ s.id }}</td><td>{{ s.trabajador_id }}</td>
          <td>{{ s.motivo }}</td><td>{{ s.estado }}</td>
          <td><button (click)="revocar(s.id)">Revocar</button></td>
        </tr>
      }
    </table>
  `,
})
export class Suspensiones implements OnInit {
  private admin = inject(AdministracionService);
  suspensiones = signal<Suspension[]>([]);
  error = signal('');

  ngOnInit() { this.cargar(); }

  cargar() {
    this.admin.listarSuspensiones().subscribe({
      next: (r) => this.suspensiones.set(r),
      error: (e) => this.error.set(mensajeError(e)),
    });
  }

  revocar(id: string) {
    this.admin.revocarSuspension(id).subscribe({
      next: () => this.cargar(),
      error: (e) => this.error.set(mensajeError(e)),
    });
  }
}