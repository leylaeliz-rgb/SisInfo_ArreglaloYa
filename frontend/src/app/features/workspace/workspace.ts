import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { NegocioService, Categoria, Zona, Cotizacion, Calificacion } from '../../core/services/negocio.service';
import { mensajeError } from '../../core/utils/errores';

@Component({
  selector: 'app-workspace',
  imports: [FormsModule],
  template: `
    <h1>Espacio de trabajo</h1>
    @if (error()) { <p class="error">{{ error() }}</p> }
    @if (mensaje()) { <p class="exito">{{ mensaje() }}</p> }

    <section class="tarjeta">
      <h2>Catálogos de servicios</h2>
      <h3>Categorías</h3>
      @if (categorias().length) {
        <ul>@for (c of categorias(); track c.id) { <li><b>{{ c.nombre }}</b> — {{ c.codigo }} @if (c.descripcion) { · {{ c.descripcion }} }</li> }</ul>
      } @else { <p>No hay categorías disponibles.</p> }
      <h3>Zonas de cobertura</h3>
      @if (zonas().length) {
        <ul>@for (z of zonas(); track z.id) { <li>{{ z.nombre }} ({{ z.tipo }})</li> }</ul>
      } @else { <p>No hay zonas disponibles.</p> }
    </section>

    @if (auth.rolActivo() === 'administrador') {
      <section class="tarjeta">
        <h2>Administrar catálogos</h2>
        <form (ngSubmit)="crearCategoria()">
          <label class="campo">Código de categoría<input name="codigo" [(ngModel)]="codigo" required maxlength="40"></label>
          <label class="campo">Nombre de categoría<input name="nombreCategoria" [(ngModel)]="nombreCategoria" required maxlength="100"></label>
          <button class="btn" type="submit">Crear categoría</button>
        </form>
        <hr>
        <form (ngSubmit)="crearZona()">
          <label class="campo">Nombre de zona<input name="nombreZona" [(ngModel)]="nombreZona" required maxlength="120"></label>
          <label class="campo">Tipo
            <select name="tipoZona" [(ngModel)]="tipoZona">
              <option value="zona">Zona</option><option value="otb">OTB</option><option value="macrodistrito">Macrodistrito</option>
            </select>
          </label>
          <button class="btn" type="submit">Crear zona</button>
        </form>
      </section>
    }

    <section class="tarjeta">
      <h2>Mis cotizaciones</h2>
      <button class="btn-sec" (click)="cargarCotizaciones()">Actualizar</button>
      @if (cotizaciones().length) {
        <ul>@for (c of cotizaciones(); track c.id) {
          <li>Solicitud #{{ c.solicitud_id }} · Bs {{ c.monto_estimado_total }} · Estado: {{ c.estado }}
            @if (auth.rolActivo() === 'trabajador' && c.estado === 'enviada') {
              <button class="btn-peligro" (click)="retirar(c.id)">Retirar</button>
            }
          </li>
        }</ul>
      } @else { <p>No tienes cotizaciones registradas.</p> }
      @if (auth.rolActivo() === 'trabajador') {
        <p class="ayuda">Para enviar una cotización necesitas el identificador de una solicitud publicada.</p>
        <form (ngSubmit)="enviarCotizacion()">
          <label class="campo">ID de solicitud<input name="solicitudId" [(ngModel)]="solicitudId" required></label>
          <label class="campo">Mano de obra (Bs)<input name="manoObra" type="number" min="0" step="0.01" [(ngModel)]="manoObra" required></label>
          <label class="campo">Materiales (Bs)<input name="materiales" type="number" min="0" step="0.01" [(ngModel)]="materiales" required></label>
          <label class="campo">Transporte (Bs)<input name="transporte" type="number" min="0" step="0.01" [(ngModel)]="transporte" required></label>
          <label class="fila"><input name="requiereVisita" type="checkbox" [(ngModel)]="requiereVisita"> Requiere visita</label>
          <button class="btn" type="submit">Enviar cotización</button>
        </form>
      }
    </section>

    <section class="tarjeta">
      <h2>Mis calificaciones</h2>
      <button class="btn-sec" (click)="cargarCalificaciones()">Actualizar</button>
      @if (calificaciones().length) {
        <ul>@for (c of calificaciones(); track c.id) {
          <li>Servicio #{{ c.servicio_id }} · {{ c.estrellas }}/5 estrellas — {{ c.comentario }}</li>
        }</ul>
      } @else { <p>Aún no tienes calificaciones visibles.</p> }
      @if (auth.rolActivo() === 'cliente') {
        <p>Calificar un servicio finalizado:</p>
        <form (ngSubmit)="guardarCalificacion()">
          <label class="campo">ID del servicio<input name="servicioId" [(ngModel)]="servicioId" required></label>
          <label class="campo">Estrellas
            <select name="estrellas" [(ngModel)]="estrellas"><option [ngValue]="5">5</option><option [ngValue]="4">4</option><option [ngValue]="3">3</option><option [ngValue]="2">2</option><option [ngValue]="1">1</option></select>
          </label>
          <label class="campo">Comentario<textarea name="comentario" [(ngModel)]="comentario" maxlength="2000" required></textarea></label>
          <button class="btn" type="submit">Guardar calificación</button>
        </form>
      }
    </section>
  `,
})
export class Workspace implements OnInit {
  auth = inject(AuthService);
  private api = inject(NegocioService);
  categorias = signal<Categoria[]>([]);
  zonas = signal<Zona[]>([]);
  cotizaciones = signal<Cotizacion[]>([]);
  calificaciones = signal<Calificacion[]>([]);
  error = signal('');
  mensaje = signal('');

  codigo = ''; nombreCategoria = ''; nombreZona = '';
  tipoZona: 'zona' | 'otb' | 'macrodistrito' = 'zona';
  solicitudId = ''; manoObra = 0; materiales = 0; transporte = 0; requiereVisita = false;
  servicioId = ''; estrellas = 5; comentario = '';

  ngOnInit() { this.cargarCatalogos(); this.cargarCotizaciones(); this.cargarCalificaciones(); }
  private informarError(e: unknown) { this.error.set(mensajeError(e as never)); }
  private limpiar() { this.error.set(''); this.mensaje.set(''); }
  cargarCatalogos() {
    this.api.categorias().subscribe({ next: r => this.categorias.set(r), error: e => this.informarError(e) });
    this.api.zonas().subscribe({ next: r => this.zonas.set(r), error: e => this.informarError(e) });
  }
  cargarCotizaciones() {
    if (!this.auth.autenticado()) return;
    this.api.cotizaciones().subscribe({ next: r => this.cotizaciones.set(r), error: e => this.informarError(e) });
  }
  cargarCalificaciones() {
    if (!this.auth.autenticado()) return;
    this.api.calificaciones().subscribe({ next: r => this.calificaciones.set(r), error: e => this.informarError(e) });
  }
  crearCategoria() {
    this.limpiar();
    this.api.crearCategoria(this.codigo.trim(), this.nombreCategoria.trim()).subscribe({
      next: () => { this.mensaje.set('Categoría creada.'); this.codigo = ''; this.nombreCategoria = ''; this.cargarCatalogos(); },
      error: e => this.informarError(e),
    });
  }
  crearZona() {
    this.limpiar();
    this.api.crearZona(this.nombreZona.trim(), this.tipoZona).subscribe({
      next: () => { this.mensaje.set('Zona creada.'); this.nombreZona = ''; this.cargarCatalogos(); },
      error: e => this.informarError(e),
    });
  }
  enviarCotizacion() {
    this.limpiar();
    this.api.enviarCotizacion(this.solicitudId.trim(), Number(this.manoObra), Number(this.materiales), Number(this.transporte), this.requiereVisita).subscribe({
      next: () => { this.mensaje.set('Cotización enviada.'); this.cargarCotizaciones(); },
      error: e => this.informarError(e),
    });
  }
  retirar(id: string) {
    this.limpiar();
    this.api.retirarCotizacion(id).subscribe({
      next: () => { this.mensaje.set('Cotización retirada.'); this.cargarCotizaciones(); },
      error: e => this.informarError(e),
    });
  }
  guardarCalificacion() {
    this.limpiar();
    this.api.guardarCalificacion(this.servicioId.trim(), Number(this.estrellas), this.comentario.trim()).subscribe({
      next: () => { this.mensaje.set('Calificación guardada.'); this.cargarCalificaciones(); },
      error: e => this.informarError(e),
    });
  }
}
