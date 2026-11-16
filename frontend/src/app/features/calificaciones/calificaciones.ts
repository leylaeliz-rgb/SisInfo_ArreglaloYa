import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { NegocioService, Calificacion, Reputacion, EvaluacionInterna } from '../../core/services/negocio.service';
import { mensajeError } from '../../core/utils/errores';

@Component({
  selector: 'app-calificaciones',
  imports: [FormsModule, DatePipe],
  template: `
    <section class="encabezado-pagina">
      <div><p class="sobre-titulo">CONFIANZA Y EXPERIENCIA</p><h1>Calificaciones</h1><p>Consulta las opiniones y gestiona las valoraciones de los servicios realizados.</p></div>
      <button class="btn-sec" type="button" (click)="cargar()">Actualizar</button>
    </section>

    @if (error()) { <p class="alerta error">{{ error() }}</p> }
    @if (mensaje()) { <p class="alerta exito">{{ mensaje() }}</p> }

    <section class="tarjeta">
      <div class="titulo-seccion"><div><h2>Mis calificaciones</h2><p>Valoraciones relacionadas con tus servicios.</p></div><span class="contador">{{ calificaciones().length }} registros</span></div>
      @if (cargando()) { <p>Cargando calificaciones...</p> }
      @else if (calificaciones().length === 0) { <p class="vacio">Todavía no hay calificaciones para mostrar.</p> }
      @else {
        <div class="tabla-contenedor"><table><thead><tr><th>Servicio</th><th>Valoración</th><th>Comentario</th><th>Actualizada</th></tr></thead><tbody>
          @for (c of calificaciones(); track c.id) {
            <tr><td>#{{ c.servicio_id }}</td><td><span class="estrellas">{{ mostrarEstrellas(c.estrellas) }}</span> <b>{{ c.estrellas }}/5</b></td><td>{{ c.comentario }}</td><td>{{ c.actualizada_en | date:'dd/MM/yyyy' }}</td></tr>
          }
        </tbody></table></div>
      }
    </section>

    @if (auth.rolActivo() === 'cliente') {
      <section class="tarjeta">
        <h2>Calificar un servicio</h2><p>Solo puedes calificar servicios que hayan finalizado.</p>
        <form (ngSubmit)="guardar()">
          <label class="campo">Identificador del servicio<input name="servicioId" [(ngModel)]="servicioId" required placeholder="ID del servicio"></label>
          <label class="campo">Tu valoración<select name="estrellas" [(ngModel)]="estrellas"><option [ngValue]="5">5 - Excelente</option><option [ngValue]="4">4 - Muy bueno</option><option [ngValue]="3">3 - Bueno</option><option [ngValue]="2">2 - Regular</option><option [ngValue]="1">1 - Malo</option></select></label>
          <label class="campo">Comentario<textarea name="comentario" [(ngModel)]="comentario" required maxlength="2000" rows="4" placeholder="Cuéntanos cómo fue el servicio"></textarea></label>
          <button class="btn" type="submit" [disabled]="guardando()">Guardar calificación</button>
        </form>
      </section>
    }

    @if (auth.rolActivo() === 'trabajador') {
      <section class="tarjeta">
        <h2>Consultar reputación de un trabajador</h2><p>Introduce el identificador del trabajador para consultar su promedio público.</p>
        <form (ngSubmit)="consultarReputacion()" class="formulario-en-linea">
          <label class="campo">ID del trabajador<input name="trabajadorId" [(ngModel)]="trabajadorId" required></label>
          <button class="btn" type="submit">Consultar</button>
        </form>
        @if (reputacion(); as r) { <div class="resumen-reputacion"><strong>{{ r.promedio ?? 'Sin promedio' }}</strong><span class="estrellas">{{ r.promedio ? '★' : '☆' }}</span><span>{{ r.total }} calificaciones</span></div> }
      </section>
      <section class="tarjeta">
        <h2>Evaluar a un cliente</h2><p>Registra una referencia interna después de finalizar un servicio.</p>
        <form (ngSubmit)="evaluarCliente()">
          <label class="campo">ID del servicio finalizado<input name="servicioEvaluarId" [(ngModel)]="servicioEvaluarId" required></label>
          <label class="campo">Valoración<select name="valoracionCliente" [(ngModel)]="valoracionCliente"><option [ngValue]="5">5 - Excelente</option><option [ngValue]="4">4 - Muy bueno</option><option [ngValue]="3">3 - Bueno</option><option [ngValue]="2">2 - Regular</option><option [ngValue]="1">1 - Malo</option></select></label>
          <label class="campo">Descripción<textarea name="descripcionCliente" [(ngModel)]="descripcionCliente" required maxlength="2000" rows="3"></textarea></label>
          <button class="btn" type="submit" [disabled]="guardando()">Guardar evaluación</button>
        </form>
      </section>
      <section class="tarjeta">
        <h2>Referencias de un cliente</h2><p>Las referencias se muestran cuando existen servicios relacionados y el acceso está permitido.</p>
        <form (ngSubmit)="consultarReferencias()" class="formulario-en-linea">
          <label class="campo">ID del cliente<input name="clienteId" [(ngModel)]="clienteId" required></label>
          <button class="btn" type="submit">Buscar referencias</button>
        </form>
        @if (referencias().length) { <ul class="referencias">@for (r of referencias(); track $index) { <li><b>{{ r.valoracion }}/5</b> — {{ r.descripcion }} <small>{{ r.creada_en | date:'dd/MM/yyyy' }}</small></li> }</ul> }
        @else if (buscoReferencias()) { <p class="vacio">No hay referencias disponibles para ese cliente.</p> }
      </section>
    }
  `,
})
export class Calificaciones implements OnInit {
  auth = inject(AuthService);
  private api = inject(NegocioService);
  calificaciones = signal<Calificacion[]>([]);
  reputacion = signal<Reputacion | null>(null);
  referencias = signal<EvaluacionInterna[]>([]);
  cargando = signal(false);
  guardando = signal(false);
  buscoReferencias = signal(false);
  error = signal('');
  mensaje = signal('');
  servicioId = '';
  estrellas = 5;
  comentario = '';
  trabajadorId = '';
  servicioEvaluarId = '';
  valoracionCliente = 5;
  descripcionCliente = '';
  clienteId = '';

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando.set(true);
    this.api.calificaciones().subscribe({
      next: data => this.calificaciones.set(data),
      error: e => { this.error.set(mensajeError(e)); this.cargando.set(false); },
      complete: () => this.cargando.set(false),
    });
  }

  guardar() {
    this.limpiar(); this.guardando.set(true);
    this.api.guardarCalificacion(this.servicioId.trim(), Number(this.estrellas), this.comentario.trim()).subscribe({
      next: () => { this.mensaje.set('Calificación guardada.'); this.servicioId = ''; this.comentario = ''; this.cargar(); },
      error: e => this.error.set(mensajeError(e)),
      complete: () => this.guardando.set(false),
    });
  }

  consultarReputacion() {
    this.limpiar(); this.reputacion.set(null);
    this.api.reputacion(this.trabajadorId.trim()).subscribe({
      next: data => this.reputacion.set(data),
      error: e => this.error.set(mensajeError(e)),
    });
  }

  evaluarCliente() {
    this.limpiar(); this.guardando.set(true);
    this.api.evaluarCliente(this.servicioEvaluarId.trim(), Number(this.valoracionCliente), this.descripcionCliente.trim()).subscribe({
      next: () => { this.mensaje.set('Evaluación interna guardada.'); this.servicioEvaluarId = ''; this.descripcionCliente = ''; },
      error: e => this.error.set(mensajeError(e)),
      complete: () => this.guardando.set(false),
    });
  }

  consultarReferencias() {
    this.limpiar(); this.referencias.set([]); this.buscoReferencias.set(false);
    this.api.referenciasCliente(this.clienteId.trim()).subscribe({
      next: data => { this.referencias.set(data); this.buscoReferencias.set(true); },
      error: e => this.error.set(mensajeError(e)),
    });
  }

  mostrarEstrellas(valor: number) { return '★'.repeat(valor) + '☆'.repeat(5 - valor); }
  private limpiar() { this.error.set(''); this.mensaje.set(''); }
}
