import { Component, OnChanges, input, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ProyectoApi } from '../core/services/proyecto-api.service';
import { environment } from '../../environments/environment';
import { mensajeError } from '../core/utils/errores';

interface Archivo { id: string; nombre: string; }
@Component({
  selector: 'app-adjuntos',
  template: `
    <details class="adjuntos"><summary>{{ tipo() === 'solicitudes' ? 'Fotografías del trabajo' : tipo() === 'pagos' ? 'Comprobantes del pago' : 'Evidencia del reclamo' }}</summary>
      @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
      @if (mensaje()) { <p class="exito" role="status">{{ mensaje() }}</p> }
      @if (cargando()) { <p role="status">Cargando archivos…</p> }
      @for (a of archivos(); track a.id) { <p><button type="button" class="btn-link" [disabled]="ocupado()" (click)="descargar(a)">{{ a.nombre }}</button></p> }
      @empty { @if (!cargando()) { <p class="ayuda">Sin archivos adjuntos.</p> } }
      @if (editar()) {
        <p class="ayuda">{{ tipo() === 'solicitudes' ? 'Hasta cinco imágenes PNG o JPEG.' : 'PDF, PNG o JPEG.' }} Máximo 2 MiB por archivo.</p>
        <label class="campo">Seleccionar archivo<input type="file" [disabled]="ocupado()" [accept]="tipo() === 'solicitudes' ? '.png,.jpg,.jpeg' : '.pdf,.png,.jpg,.jpeg'" (change)="seleccionar($event)"></label>
        <button type="button" class="btn-sec" [disabled]="ocupado() || !seleccion" (click)="subir()">Subir archivo</button>
      }
    </details>
  `,
})
export class Adjuntos implements OnChanges {
  tipo = input.required<'solicitudes' | 'pagos' | 'reclamos'>();
  recurso = input.required<string>();
  editar = input(false);
  private readonly api = inject(ProyectoApi);
  private readonly http = inject(HttpClient);
  archivos = signal<Archivo[]>([]);
  error = signal('');
  mensaje = signal('');
  ocupado = signal(false);
  cargando = signal(false);
  seleccion: File | null = null;

  ngOnChanges() { void this.cargar(); }
  private async cargar() {
    this.cargando.set(true); this.error.set(''); this.mensaje.set(''); this.seleccion = null;
    const recurso = this.recurso();
    try {
      const filas = await this.api.get<Archivo[]>('/adjuntos/' + this.tipo() + '/' + recurso);
      if (this.recurso() === recurso) this.archivos.set(filas);
    } catch (e) {
      if (this.recurso() === recurso) this.fallar(e);
    } finally { this.cargando.set(false); }
  }
  seleccionar(e: Event) { this.seleccion = (e.target as HTMLInputElement).files?.[0] ?? null; }
  private fallar(e: unknown) {
    this.error.set(e instanceof HttpErrorResponse ? mensajeError(e) : 'No se pudo procesar el archivo.');
  }
  async subir() {
    if (!this.seleccion || this.ocupado()) return;
    if (this.seleccion.size > 2097152) { this.error.set('El límite es 2 MiB.'); return; }
    this.ocupado.set(true); this.error.set('');
    try {
      const datos = new FormData(); datos.append('archivo', this.seleccion);
      await this.api.enviar('POST', '/adjuntos/' + this.tipo() + '/' + this.recurso(), datos);
      await this.cargar();
      this.mensaje.set('Archivo guardado.');
    } catch (e) { this.fallar(e); }
    finally { this.ocupado.set(false); }
  }
  async descargar(a: Archivo) {
    if (this.ocupado()) return;
    this.ocupado.set(true); this.error.set('');
    try {
      const blob = await firstValueFrom(this.http.get(environment.apiUrl + '/adjuntos/archivo/' + a.id + '/descarga', { responseType: 'blob' }));
      const url = URL.createObjectURL(blob); const enlace = document.createElement('a');
      enlace.href = url; enlace.download = a.nombre; enlace.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { this.fallar(e); }
    finally { this.ocupado.set(false); }
  }
}
