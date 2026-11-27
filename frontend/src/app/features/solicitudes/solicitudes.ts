import { Adjuntos } from '../../shared/adjuntos';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Pantalla } from '../../shared/pantalla';
import { Feedback } from '../../shared/feedback';
import { Opcion, Solicitud, Trabajador, Oferta } from '../../core/services/proyecto-api.service';
import { ComparadorCotizaciones } from './comparador-cotizaciones';

@Component({
  imports: [FormsModule, CurrencyPipe, RouterLink, Feedback, Adjuntos, ComparadorCotizaciones],
  templateUrl: './solicitudes.html',
})
export class SolicitudesPage extends Pantalla implements OnInit {
  categorias: Opcion[] = [];
  zonas: Opcion[] = [];
  solicitudes: Solicitud[] = [];
  trabajadores: Trabajador[] = [];
  ofertas: Oferta[] = [];
  categoria = '';
  zona = '';
  titulo = '';
  descripcion = '';
  urgente = false;
  destinatario = '';
  busqueda = '';
  filtroZona = '';
  seleccionada: Solicitud | null = null;
  editarId: string | null = null;
  manoObra = 0;
  materiales = 0;
  transporte = 0;
  requiereVisita = false;
  condiciones = '';

  ngOnInit() { void this.realizar(() => this.cargar(), ''); }

  async cargar() {
    const trabajador = this.auth.rolActivo() === 'trabajador';
    const [categorias, zonas, solicitudes, trabajadores, ofertas] = await Promise.all([
      this.api.get<Opcion[]>('/catalogos/categorias'),
      this.api.get<Opcion[]>('/catalogos/zonas'),
      this.api.get<Solicitud[]>(trabajador ? '/solicitudes/explorar' : '/solicitudes/me'),
      this.api.get<Trabajador[]>('/panel/trabajadores'), 
      this.api.get<Oferta[]>('/panel/cotizaciones'),
    ]);
    this.categorias = categorias; this.zonas = zonas; this.solicitudes = solicitudes;
    this.trabajadores = trabajadores; this.ofertas = ofertas;
  }

  get profesionales() {
    const texto = this.busqueda.toLocaleLowerCase();
    return this.trabajadores.filter(t => (!this.filtroZona || t.zona_base_id === this.filtroZona) &&
      (t.nombre_completo + ' ' + (t.descripcion ?? '') + ' ' + t.especialidades.join(' ')).toLocaleLowerCase().includes(texto));
  }

  nombreZona(id: string) { return this.zonas.find(z => z.id === id)?.nombre ?? 'Zona'; }
  nombreCategoria(id: string) { return this.categorias.find(c => c.id === id)?.nombre ?? 'Servicio'; }

  ofertasDe(id: string) { return this.ofertas.filter(o => o.solicitud_id === id); }

  guardar() {
    void this.realizar(async () => {
      if (this.editarId) {
        await this.api.enviar('PATCH', '/solicitudes/' + this.editarId, { titulo: this.titulo, descripcion: this.descripcion });
      } else {
        await this.api.enviar('POST', '/solicitudes' + (this.destinatario ? '/directas/' + this.destinatario : ''), {
          categoriaId: this.categoria, zonaId: this.zona, titulo: this.titulo, descripcion: this.descripcion, urgente: this.urgente,
        });
      }
      this.editarId = null; this.titulo = ''; this.descripcion = ''; this.destinatario = '';
      await this.cargar();
    });
  }

  editar(s: Solicitud) {
    this.editarId = s.id; this.titulo = s.titulo; this.descripcion = s.descripcion;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelar(s: Solicitud) {
    if (!confirm('¿Cancelar esta solicitud?')) return;
    void this.realizar(async () => {
      await this.api.enviar('PUT', '/solicitudes/' + s.id + '/cancelacion', { motivo: 'Cancelada por el cliente desde su panel' });
      await this.cargar();
    });
  }

  cotizar() {
    const solicitud = this.seleccionada;
    if (!solicitud) return;
    if (!this.requiereVisita) this.transporte = 0;
    for (const [nombre, valor] of [
      ['Mano de obra', this.manoObra], ['Materiales', this.materiales], ['Transporte', this.transporte],
    ] as const) {
      if (typeof valor !== 'number' || !Number.isFinite(valor) ||
          !/^[0-9]{1,8}(\.[0-9]{1,2})?$/.test(String(valor))) {
        this.error.set(`Completa ${nombre} con un importe válido de hasta dos decimales. Usa 0 si no corresponde.`);
        return;
      }
    }
    void this.realizar(async () => {
      await this.api.enviar('POST', '/cotizaciones/solicitudes/' + solicitud.id, {
        manoObra: String(this.manoObra), materiales: String(this.materiales), transporte: String(this.transporte),
        requiereVisita: this.requiereVisita,
      });
      this.seleccionada = null;
      await this.cargar();
    }, 'Cotización enviada.');
  }

  contratar(o: Oferta) {
    if (!confirm('¿Elegir esta propuesta? Las demás ofertas pendientes de esta solicitud se rechazarán automáticamente.')) return;
    void this.realizar(async () => {
      await this.api.enviar('POST', '/servicios/cotizaciones/' + o.id);
      await this.cargar();
    }, 'Propuesta elegida. Continúa en Mis servicios para acordar el precio definitivo.');
  }

  retirar(o: Oferta) {
    void this.realizar(async () => {
      await this.api.enviar('PUT', '/cotizaciones/' + o.id + '/retiro');
      await this.cargar();
    });
  }

  enviarDirecta(t: Trabajador) {
    this.destinatario = t.id;
    this.zona = t.zona_base_id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
