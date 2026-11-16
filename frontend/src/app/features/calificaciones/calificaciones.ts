import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Pantalla } from '../../shared/pantalla';
import { Feedback } from '../../shared/feedback';
import { Servicio, Trabajador } from '../../core/services/proyecto-api.service';

interface Calificacion { id: string; servicio_id: string; estrellas: number; comentario: string; actualizada_en: string; }
@Component({
  imports: [FormsModule, DatePipe, Feedback],
  template: `
    <header class="encabezado-pagina"><div><p class="sobre-titulo">EXPERIENCIAS VERIFICABLES</p><h1>Calificaciones y reputación</h1>
      <p>Las valoraciones están vinculadas a servicios finalizados.</p></div></header>
    <app-feedback [error]="error()" [mensaje]="mensaje()" [ocupado]="ocupado()" />
    <fieldset class="sin-borde" [disabled]="ocupado()">
    @if (auth.rolActivo() === 'cliente') {
      <form class="tarjeta" (ngSubmit)="guardar()"><h2>Valorar un trabajo</h2>
        <label class="campo">Servicio<select name="servicio" [(ngModel)]="servicio" required>
          <option value="" disabled>Selecciona un servicio finalizado</option>
          @for (s of servicios; track s.id) { <option [value]="s.id">{{ s.titulo }} · {{ s.trabajador }}</option> }
        </select></label>
        <label class="campo">Puntuación<select name="estrellas" [(ngModel)]="estrellas">
          @for (n of [1,2,3,4,5]; track n) { <option [ngValue]="n">{{ n }} estrellas</option> }
        </select></label>
        <label class="campo">Tu experiencia<textarea name="comentario" [(ngModel)]="comentario" maxlength="2000" required></textarea></label>
        <button class="btn">Guardar valoración</button>
      </form>
    }
    <section class="tarjeta"><h2>Mis valoraciones</h2>
      @for (c of calificaciones; track c.id) {
        <article class="item-detalle"><h3>{{ titulo(c.servicio_id) }}</h3>
          <p class="estrellas">{{ c.estrellas }} de 5 estrellas</p><p>{{ c.comentario }}</p>
          <p class="ayuda">{{ c.actualizada_en | date:'dd/MM/yyyy HH:mm' }}</p>
          @if (auth.rolActivo() === 'cliente') {
            <div class="fila"><button class="btn-sec" (click)="editar(c)">Editar</button>
            <button class="btn-peligro" (click)="retirar(c)">Retirar valoración</button></div>
          }
        </article>
      } @empty { <p>Todavía no hay valoraciones vinculadas a tu cuenta.</p> }
    </section>
    <form class="tarjeta" (ngSubmit)="consultarReputacion()"><h2>Consultar reputación</h2>
      <label class="campo">Profesional<select name="profesional" [(ngModel)]="profesional" required>
        <option value="" disabled>Selecciona un profesional</option>
        @for (t of trabajadores; track t.id) { <option [value]="t.id">{{ t.nombre_completo }}</option> }
      </select></label><button class="btn-sec">Consultar</button>
      @if (reputacion) { <p class="resumen-reputacion"><strong>{{ reputacion.promedio ?? 'Sin puntuación' }}</strong><span>{{ reputacion.total }} valoraciones</span></p> }
    </form>
    </fieldset>
  `,
})
export class Calificaciones extends Pantalla implements OnInit {
  servicios: Servicio[] = [];
  trabajadores: Trabajador[] = [];
  calificaciones: Calificacion[] = [];
  servicio = '';
  profesional = '';
  estrellas = 5;
  comentario = '';
  reputacion: { total: number; promedio: string | null } | null = null;
  ngOnInit() { void this.realizar(() => this.cargar(), ''); }
  async cargar() {
    const [s, t, c] = await Promise.all([
      this.api.get<Servicio[]>('/panel/servicios'), this.api.get<Trabajador[]>('/panel/trabajadores'),
      this.api.get<Calificacion[]>('/calificaciones/me'),
    ]);
    this.servicios = s.filter(v => v.estado === 'finalizado');
    this.trabajadores = t; this.calificaciones = c;
  }
  titulo(id: string) { return this.servicios.find(s => s.id === id)?.titulo ?? 'Servicio finalizado'; }
  editar(c: Calificacion) { this.servicio = c.servicio_id; this.estrellas = c.estrellas; this.comentario = c.comentario; window.scrollTo({ top: 0, behavior: 'smooth' }); }
  guardar() {
    void this.realizar(async () => {
      await this.api.enviar('PUT', '/calificaciones/' + this.servicio, { estrellas: this.estrellas, comentario: this.comentario });
      this.comentario = ''; await this.cargar();
    });
  }
  retirar(c: Calificacion) {
    if (!confirm('¿Retirar la valoración? Se conservará su historial.')) return;
    void this.realizar(async () => {
      await this.api.enviar('DELETE', '/calificaciones/' + c.servicio_id);
      await this.cargar();
    });
  }
  consultarReputacion() {
    void this.realizar(async () => {
      this.reputacion = await this.api.get('/calificaciones/trabajadores/' + this.profesional);
    }, '');
  }
}
