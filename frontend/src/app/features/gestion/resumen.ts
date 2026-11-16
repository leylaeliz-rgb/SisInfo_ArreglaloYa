import { FormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Pantalla } from '../../shared/pantalla';
import { Feedback } from '../../shared/feedback';

interface Resumen {
  usuarios: number; trabajadores_aprobados: number; solicitudes_abiertas: number;
  servicios_activos: number; reclamos_pendientes: number; verificaciones_pendientes: number;
}

@Component({
  imports: [FormsModule, RouterLink, Feedback],
  template: `
    <header class="encabezado-pagina"><div><p class="sobre-titulo">VISIÓN GENERAL</p><h1>Panel de administración</h1>
      <p>Actividad registrada en la plataforma.</p></div><button class="btn-sec" (click)="actualizar()" [disabled]="ocupado()">Actualizar</button></header>
    <app-feedback [error]="error()" [mensaje]="mensaje()" [ocupado]="ocupado()" />
    <form class="tarjeta formulario-en-linea" (ngSubmit)="actualizar()">
      <label class="campo">Desde<input type="date" name="desde" [(ngModel)]="desde"></label>
      <label class="campo">Hasta<input type="date" name="hasta" [(ngModel)]="hasta"></label>
      <button class="btn" [disabled]="ocupado()">Filtrar reporte</button>
      <button type="button" class="btn-sec" [disabled]="ocupado()" (click)="desde='';hasta='';actualizar()">Todo el período</button>
    </form>
    <p class="ayuda">Cuentas y operaciones creadas dentro del período indicado, según su estado actual.</p>
    @if (resumen; as r) {
      <div class="rejilla-catalogo">
        <article class="tarjeta indicador"><strong>{{ r.usuarios }}</strong><span>Cuentas activas</span></article>
        <article class="tarjeta indicador"><strong>{{ r.trabajadores_aprobados }}</strong><span>Profesionales aprobados</span></article>
        <article class="tarjeta indicador"><strong>{{ r.solicitudes_abiertas }}</strong><span>Solicitudes abiertas</span></article>
        <article class="tarjeta indicador"><strong>{{ r.servicios_activos }}</strong><span>Servicios activos</span></article>
        <article class="tarjeta indicador"><strong>{{ r.reclamos_pendientes }}</strong><span>Reclamos por atender</span></article>
        <article class="tarjeta indicador"><strong>{{ r.verificaciones_pendientes }}</strong><span>Verificaciones por revisar</span></article>
      </div>
    }
    <section class="tarjeta"><h2>Gestionar la plataforma</h2><div class="fila">
      <a class="btn" routerLink="/gestion">Documentación, reclamos y apelaciones</a>
      <a class="btn-sec" routerLink="/admin/sanciones">Incidencias y suspensiones</a>
      <a class="btn-sec" routerLink="/catalogo">Categorías y zonas</a>
    </div></section>
  `,
})
export class ResumenAdmin extends Pantalla implements OnInit {
  desde = '';
  hasta = '';
  resumen: Resumen | null = null;
  ngOnInit() { void this.actualizar(); }
  actualizar() {
    return this.realizar(async () => {
      const parametros = new URLSearchParams();
      if (this.desde) parametros.set('desde', this.desde);
      if (this.hasta) parametros.set('hasta', this.hasta);
      const filas = await this.api.get<Resumen[]>('/panel/resumen?' + parametros.toString());
      this.resumen = filas[0] ?? null;
    }, '');
  }
}
