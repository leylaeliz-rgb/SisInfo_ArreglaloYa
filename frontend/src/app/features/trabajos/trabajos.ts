import { Adjuntos } from '../../shared/adjuntos';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Pantalla } from '../../shared/pantalla';
import { Feedback } from '../../shared/feedback';
import { Servicio, Precio } from '../../core/services/proyecto-api.service';

@Component({
  imports: [FormsModule, CurrencyPipe, DatePipe, Feedback, Adjuntos],
  templateUrl: './trabajos.html',
})
export class TrabajosPage extends Pantalla implements OnInit {
  servicios: Servicio[] = [];
  seleccionado: Servicio | null = null;
  filtro = '';
  accion = '';
  manoObra = 0;
  materiales = 0;
  transporte = 0;
  justificacion = '';
  fecha = '';
  metodo = 'efectivo';
  conforme = false;
  estrellas = 5;
  comentario = '';
  tipo = 'tecnico';
  enlace = '';
  referencias: { valoracion: number; descripcion: string }[] | null = null;

  ngOnInit() { void this.actualizar(); }
  actualizar() { return this.realizar(() => this.cargar(), ''); }
  async cargar() {
    const datos = await this.api.get<Servicio[]>('/panel/servicios');
    this.servicios = datos;
    if (this.seleccionado) this.seleccionado = datos.find(s => s.id === this.seleccionado?.id) ?? null;
  }
  get visibles() { return this.servicios.filter(s => !this.filtro || s.estado === this.filtro); }
  get esCliente() { return this.auth.rolActivo() === 'cliente'; }
  pago(s: Servicio, tipo: string) { return s.pagos.find(p => p.tipo === tipo); }
  pendientes(s: Servicio) { return s.precios.filter(p => p.estado === 'pendiente'); }
  abrir(s: Servicio) { this.seleccionado = s; this.accion = ''; this.enlace = ''; this.referencias = null; }
  formulario(accion: string) {
    this.accion = accion; this.justificacion = ''; this.comentario = ''; this.conforme = false;
    this.fecha = ''; this.manoObra = 0; this.materiales = 0; this.transporte = 0;
  }

  ejecutar(metodo: 'POST' | 'PUT' | 'DELETE', ruta: string, cuerpo?: unknown, mensaje = 'Operación registrada.') {
    return this.realizar(async () => {
      await this.api.enviar(metodo, ruta, cuerpo);
      this.accion = '';
      await this.cargar();
    }, mensaje);
  }

  decidir(s: Servicio, p: Precio, aceptar: boolean) {
    if (!confirm(aceptar ? '¿Aceptar este precio?' : 'Rechazar el precio cancelará el servicio. ¿Continuar?')) return;
    const ruta = '/servicios/' + s.id + (aceptar && p.tipo === 'incrementado' ? '/incrementos/' : '/precios/') +
      p.id + (aceptar ? '/aceptacion' : '/rechazo');
    void this.ejecutar('PUT', ruta);
  }

  iniciar(s: Servicio) { void this.ejecutar('PUT', '/servicios/' + s.id + '/inicio'); }
  finalizar(s: Servicio) {
    if (confirm('¿El trabajo está terminado?')) void this.ejecutar('PUT', '/servicios/' + s.id + '/finalizacion');
  }
  anticipo(s: Servicio) {
    if (confirm('Se registrará un anticipo simulado. ¿Continuar?')) {
      void this.ejecutar('PUT', '/pagos/' + s.id + '/anticipo', undefined, 'Anticipo simulado registrado.');
    }
  }
  recepcion(s: Servicio) {
    if (confirm('¿Confirmas que recibiste el saldo del cliente?')) {
      void this.ejecutar('PUT', '/pagos/' + s.id + '/saldo/recepcion');
    }
  }
  cancelar(s: Servicio) {
    if (!confirm('¿Cancelar el servicio? El tratamiento del anticipo depende de la anticipación a la visita.')) return;
    if (this.esCliente) void this.ejecutar('DELETE', '/servicios/' + s.id);
    else this.formulario('cancelar');
  }

  guardar() {
    const s = this.seleccionado;
    if (!s) return;
    const prefijo = '/servicios/' + s.id;
    switch (this.accion) {
      case 'precio':
        void this.ejecutar('POST', prefijo + '/precios', {
          manoObra: String(this.manoObra), materiales: String(this.materiales), transporte: String(this.transporte),
        }); break;
      case 'incremento':
        void this.ejecutar('POST', prefijo + '/incrementos', {
          manoObra: String(this.manoObra), materiales: String(this.materiales), justificacion: this.justificacion,
        }); break;
      case 'visita': {
        const fecha = new Date(this.fecha);
        if (!this.fecha || !Number.isFinite(fecha.getTime()) || fecha.getTime() <= Date.now()) {
          this.error.set('Selecciona una fecha futura.'); return;
        }
        void this.ejecutar('PUT', prefijo + '/visita', { fecha: fecha.toISOString() }); break;
      }
      case 'saldo':
        void this.ejecutar('PUT', '/pagos/' + s.id + '/saldo', { metodo: this.metodo, conforme: this.conforme }); break;
      case 'calificar':
        void this.ejecutar('PUT', '/calificaciones/' + s.id, { estrellas: this.estrellas, comentario: this.comentario }); break;
      case 'evaluar':
        void this.ejecutar('PUT', '/calificaciones/servicios/' + s.id + '/evaluacion-interna', {
          valoracion: this.estrellas, descripcion: this.comentario,
        }); break;
      case 'reclamo':
        void this.ejecutar('POST', '/reclamos/servicios/' + s.id, {
          tipo: this.tipo, descripcion: this.comentario,
        }, 'Reclamo presentado. Puedes seguirlo en Incidencias.'); break;
      case 'cancelar':
        void this.ejecutar('PUT', prefijo + '/cancelacion-trabajador', { motivo: this.justificacion }); break;
    }
  }

  consultarReferencias(s: Servicio) {
    void this.realizar(async () => {
      this.referencias = await this.api.get('/calificaciones/clientes/' + s.cliente_id + '/evaluaciones-internas');
    }, '');
  }

  contacto(s: Servicio) {
    void this.realizar(async () => {
      const dato = await this.api.get<{ enlace: string }>('/servicios/' + s.id + '/contacto');
      this.enlace = dato.enlace;
    }, '');
  }
}
