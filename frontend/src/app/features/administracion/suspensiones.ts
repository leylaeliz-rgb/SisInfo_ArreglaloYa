import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Pantalla } from '../../shared/pantalla';
import { Feedback } from '../../shared/feedback';

interface Incidencia { id: string; trabajador_id: string; motivo: string; estado: string; }
interface Suspension {
  id: string; trabajador_id: string; motivo: string; estado: string;
  duracion_dias: number; inicia_en: string; termina_en: string;
}

@Component({
  imports: [FormsModule, DatePipe, Feedback],
  template: `
    <header class="encabezado-pagina"><div><p class="sobre-titulo">CONDUCTA Y CUMPLIMIENTO</p><h1>Incidencias y suspensiones</h1>
    <p>Revisa los hechos antes de aplicar una medida.</p></div>
    <button class="btn-actualizar" (click)="actualizar()" [disabled]="ocupado()">
      <span>Actualizar</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
    </button></header>
    <app-feedback [error]="error()" [mensaje]="mensaje()" [ocupado]="ocupado()" />
    <fieldset class="sin-borde" [disabled]="ocupado()">
      <form class="tarjeta" (ngSubmit)="registrarSuspension()"><h2>Registrar suspension temporal</h2>
        <p>La fecha final se incluye en el periodo. El trabajador no podra enviar cotizaciones durante esas fechas.</p>
        <label class="campo">Trabajador<select name="trabajadorSuspension" [(ngModel)]="trabajadorSuspension" required>
          <option value="" disabled>Selecciona un profesional</option>
          @for (p of profesionales; track p.id) { <option [value]="p.id">{{ p.nombre_completo }}</option> }
        </select></label>
        <label class="campo">Motivo<textarea name="motivoSuspension" [(ngModel)]="motivoSuspension" maxlength="2000" required></textarea></label>
        <div class="fila">
          <label class="campo">Desde<input type="date" name="fechaInicio" [(ngModel)]="fechaInicio" [min]="hoy" required /></label>
          <label class="campo">Hasta inclusive<input type="date" name="fechaFin" [(ngModel)]="fechaFin" [min]="fechaInicio" required /></label>
        </div>
        @if (duracionDias > 0) { <p>Duracion seleccionada: {{ duracionDias }} dia(s) calendario.</p> }
        <button class="btn-peligro">Registrar suspension</button>
      </form>
    </fieldset>
    <fieldset class="sin-borde" [disabled]="ocupado()">
    <form class="tarjeta" (ngSubmit)="registrar()"><h2>Registrar incidencia</h2>
      <label class="campo">Profesional<select name="trabajador" [(ngModel)]="trabajador" required>
        <option value="" disabled>Selecciona un profesional</option>
        @for (p of profesionales; track p.id) { <option [value]="p.id">{{ p.nombre_completo }}</option> }
      </select></label>
      <label class="campo">Hechos<textarea name="motivo" [(ngModel)]="motivo" maxlength="2000" required></textarea></label>
      <button class="btn">Registrar para revisión</button>
    </form>
    <section class="tarjeta"><h2>Incidencias registradas</h2>
      @for (i of incidencias; track i.id) {
        <article class="item-detalle"><h3>{{ nombre(i.trabajador_id) }}</h3><p>{{ i.motivo }}</p><p>{{ i.estado }}</p>
        @if (i.estado === 'pendiente') { <button class="btn-sec" (click)="seleccionada=i;observaciones=''">Revisar</button> }
        @if (i.estado === 'confirmada') { <button class="btn-peligro" (click)="suspender(i)">Aplicar suspensión progresiva</button> }
        </article>
      } @empty { <p>Sin incidencias registradas.</p> }
    </section>
    @if (seleccionada; as i) {
      <form class="tarjeta" (ngSubmit)="revisar()"><h2>Revisión de {{ nombre(i.trabajador_id) }}</h2><p>{{ i.motivo }}</p>
        <label class="campo">Resultado<select name="estado" [(ngModel)]="estado"><option value="confirmada">Confirmar incidencia</option><option value="descartada">Descartar incidencia</option></select></label>
        <label class="campo">Fundamento<textarea name="observaciones" [(ngModel)]="observaciones" maxlength="2000" required></textarea></label>
        <div class="fila"><button class="btn">Registrar revisión</button><button type="button" class="btn-sec" (click)="seleccionada=null">Cerrar</button></div>
      </form>
    }
    <section class="tarjeta"><h2>Suspensiones</h2>
      @for (s of suspensiones; track s.id) {
        <article class="item-detalle"><h3>{{ nombre(s.trabajador_id) }}</h3><p>{{ s.motivo }}</p>
        <p>{{ s.estado }} · {{ s.duracion_dias }} días · {{ s.inicia_en | date:'dd/MM/yyyy' }} a {{ s.termina_en | date:'dd/MM/yyyy' }}</p>
        @if (s.estado === 'activa' || s.estado === 'programada') { <button class="btn-sec" (click)="revocar(s)">Revocar suspensión</button> }
        </article>
      } @empty { <p>Sin suspensiones registradas.</p> }
    </section>
    </fieldset>
  `,
})
export class Suspensiones extends Pantalla implements OnInit {
  profesionales: { id: string; nombre_completo: string }[] = [];
  incidencias: Incidencia[] = [];
  suspensiones: Suspension[] = [];
  trabajador = '';
  motivo = '';
  trabajadorSuspension = '';
  motivoSuspension = '';
  fechaInicio = this.fechaLocal();
  fechaFin = this.fechaLocal();
  readonly hoy = this.fechaLocal();
  seleccionada: Incidencia | null = null;
  estado = 'confirmada';
  observaciones = '';
  ngOnInit() { void this.actualizar(); }
  private fechaLocal() {
    const ahora = new Date();
    return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
  }
  get duracionDias() {
    if (!this.fechaInicio || !this.fechaFin) return 0;
    const inicio = Date.parse(`${this.fechaInicio}T00:00:00.000Z`);
    const fin = Date.parse(`${this.fechaFin}T00:00:00.000Z`);
    if (!Number.isFinite(inicio) || !Number.isFinite(fin) || fin < inicio) return 0;
    return Math.floor((fin - inicio) / 86400000) + 1;
  }
  actualizar() { return this.realizar(() => this.cargar(), ''); }
  async cargar() {
    const [p, i, s] = await Promise.all([
      this.api.get<{ id: string; nombre_completo: string }[]>('/panel/profesionales'),
      this.api.get<Incidencia[]>('/administracion/incidencias'), this.api.get<Suspension[]>('/administracion/suspensiones'),
    ]);
    this.profesionales = p; this.incidencias = i; this.suspensiones = s;
  }
  nombre(id: string) { return this.profesionales.find(p => p.id === id)?.nombre_completo ?? 'Profesional'; }
  registrar() {
    void this.realizar(async () => {
      await this.api.enviar('POST', '/administracion/incidencias', { trabajadorId: this.trabajador, motivo: this.motivo });
      this.motivo = ''; await this.cargar();
    });
  }
  revisar() {
    if (!this.seleccionada) return;
    const id = this.seleccionada.id;
    void this.realizar(async () => {
      await this.api.enviar('PATCH', '/administracion/incidencias/' + id, { estado: this.estado, observaciones: this.observaciones });
      this.seleccionada = null; await this.cargar();
    });
  }
  suspender(i: Incidencia) {
    if (!confirm('¿Aplicar la suspensión correspondiente al historial de faltas?')) return;
    void this.realizar(async () => {
      await this.api.enviar('POST', '/administracion/incidencias/' + i.id + '/suspension');
      await this.cargar();
    });
  }
  registrarSuspension() {
    void this.realizar(async () => {
      await this.api.enviar('POST', '/administracion/suspensiones', {
        trabajadorId: this.trabajadorSuspension, motivo: this.motivoSuspension,
        iniciaEn: this.fechaInicio, terminaEn: this.fechaFin,
      });
      this.trabajadorSuspension = ''; this.motivoSuspension = '';
      this.fechaInicio = this.fechaLocal(); this.fechaFin = this.fechaInicio;
      await this.cargar();
    }, 'Suspension registrada.');
  }
  revocar(s: Suspension) {
    if (!confirm('¿Dejar sin efecto esta suspensión?')) return;
    void this.realizar(async () => {
      await this.api.enviar('PUT', '/administracion/suspensiones/' + s.id + '/revocacion');
      await this.cargar();
    });
  }
}
