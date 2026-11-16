import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { NegocioService, Cotizacion } from '../../core/services/negocio.service';
import { mensajeError } from '../../core/utils/errores';

@Component({
  selector: 'app-workspace',
  imports: [FormsModule],
  template: `
    <section class="encabezado-pagina"><div><p class="sobre-titulo">GESTIÓN DE TRABAJOS</p><h1>Cotizaciones</h1><p>Consulta y administra las propuestas enviadas o recibidas.</p></div><button class="btn-sec" type="button" (click)="cargar()">Actualizar</button></section>
    @if (error()) { <p class="alerta error">{{ error() }}</p> }
    @if (mensaje()) { <p class="alerta exito">{{ mensaje() }}</p> }
    <section class="tarjeta">
      <div class="titulo-seccion"><div><h2>Mis cotizaciones</h2><p>Se muestran las cotizaciones asociadas a tu cuenta.</p></div><span class="contador">{{ cotizaciones().length }} registros</span></div>
      @if (cargando()) { <p>Cargando cotizaciones...</p> }
      @else if (!cotizaciones().length) { <p class="vacio">Todavía no tienes cotizaciones registradas.</p> }
      @else { <div class="lista-cotizaciones">@for (c of cotizaciones(); track c.id) {
        <article class="cotizacion"><div><strong>Solicitud #{{ c.solicitud_id }}</strong><p>Importe estimado: {{ c.moneda }} {{ c.monto_estimado_total }}</p></div><div class="acciones-cotizacion"><span class="estado-cotizacion">{{ c.estado }}</span>@if (auth.rolActivo() === 'trabajador' && c.estado === 'enviada') { <button class="btn-peligro" type="button" (click)="retirar(c.id)">Retirar</button> }</div></article>
      }</div> }
    </section>
    @if (auth.rolActivo() === 'trabajador') {
      <section class="tarjeta"><h2>Enviar una cotización</h2><p>Necesitas el identificador de una solicitud publicada y un perfil de trabajador aprobado, disponible y habilitado para esa categoría y zona.</p>
        <form (ngSubmit)="enviar()">
          <label class="campo">ID de solicitud<input name="solicitudId" [(ngModel)]="solicitudId" required></label>
          <div class="rejilla-formularios">
            <label class="campo">Mano de obra (Bs)<input name="manoObra" type="number" min="0" step="0.01" [(ngModel)]="manoObra" required></label>
            <label class="campo">Materiales (Bs)<input name="materiales" type="number" min="0" step="0.01" [(ngModel)]="materiales" required></label>
            <label class="campo">Transporte (Bs)<input name="transporte" type="number" min="0" step="0.01" [(ngModel)]="transporte" required></label>
          </div>
          <label class="fila"><input name="requiereVisita" type="checkbox" [(ngModel)]="requiereVisita"> Requiere visita</label>
          <button class="btn" type="submit" [disabled]="guardando()">Enviar cotización</button>
        </form>
      </section>
    }
  `,
})
export class Workspace implements OnInit {
  auth = inject(AuthService);
  private api = inject(NegocioService);
  cotizaciones = signal<Cotizacion[]>([]);
  cargando = signal(false);
  guardando = signal(false);
  error = signal('');
  mensaje = signal('');
  solicitudId = '';
  manoObra = 0;
  materiales = 0;
  transporte = 0;
  requiereVisita = false;

  ngOnInit() { this.cargar(); }
  cargar() {
    this.cargando.set(true);
    this.api.cotizaciones().subscribe({
      next: data => this.cotizaciones.set(data),
      error: e => { this.error.set(mensajeError(e)); this.cargando.set(false); },
      complete: () => this.cargando.set(false),
    });
  }
  enviar() {
    this.limpiar(); this.guardando.set(true);
    this.api.enviarCotizacion(this.solicitudId.trim(), Number(this.manoObra), Number(this.materiales), Number(this.transporte), this.requiereVisita).subscribe({
      next: () => { this.mensaje.set('Cotización enviada.'); this.solicitudId = ''; this.cargar(); },
      error: e => { this.error.set(mensajeError(e)); this.guardando.set(false); },
      complete: () => this.guardando.set(false),
    });
  }
  retirar(id: string) {
    this.limpiar();
    this.api.retirarCotizacion(id).subscribe({
      next: () => { this.mensaje.set('Cotización retirada.'); this.cargar(); },
      error: e => this.error.set(mensajeError(e)),
    });
  }
  private limpiar() { this.error.set(''); this.mensaje.set(''); }
}
