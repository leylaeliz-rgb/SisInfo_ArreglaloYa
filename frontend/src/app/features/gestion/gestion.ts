import { Adjuntos } from '../../shared/adjuntos';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Pantalla } from '../../shared/pantalla';
import { Feedback } from '../../shared/feedback';
import { Verificacion, Reclamo, Apelacion, Documento, Servicio } from '../../core/services/proyecto-api.service';

@Component({
  imports: [FormsModule, Feedback, Adjuntos],
  templateUrl: './gestion.html',
})
export class GestionPage extends Pantalla implements OnInit {
  verificaciones: Verificacion[] = [];
  reclamos: Reclamo[] = [];
  apelaciones: Apelacion[] = [];
  servicios: Servicio[] = [];
  pestana = 'reclamos';
  seleccionado: Verificacion | null = null;
  criterio = 'identidad';
  resultado = 'aprobado';
  observaciones = '';
  decision = 'aprobada';
  motivo = '';
  solicitudReclamo = '';
  tipo = 'tecnico';
  descripcion = '';
  reclamo: Reclamo | null = null;
  apelacion: Apelacion | null = null;
  estadoResolucion = 'resuelto';
  estadoApelacion = 'aceptada';
  resolucion = '';

  get admin() { return this.auth.rolActivo() === 'administrador'; }
  get cliente() { return this.auth.rolActivo() === 'cliente'; }
  get trabajador() { return this.auth.rolActivo() === 'trabajador'; }
  ngOnInit() {
    if (this.admin) this.pestana = 'verificaciones';
    void this.actualizar();
  }
  actualizar() { return this.realizar(() => this.cargar(), ''); }
  async cargar() {
    const [verificaciones, reclamos, apelaciones, servicios] = await Promise.all([
      this.api.get<Verificacion[]>('/panel/verificaciones'), this.api.get<Reclamo[]>('/panel/reclamos'),
      this.api.get<Apelacion[]>('/panel/apelaciones'), this.api.get<Servicio[]>('/panel/servicios'),
    ]);
    this.verificaciones = verificaciones; this.reclamos = reclamos; this.apelaciones = apelaciones;
    this.servicios = servicios.filter(s => s.estado === 'finalizado');
    if (this.seleccionado) this.seleccionado = verificaciones.find(v => v.id === this.seleccionado?.id) ?? null;
  }
  descargar(d: Documento) { void this.realizar(() => this.api.descargar(d.id), ''); }

  revisarDocumento(d: Documento, estado: 'aprobado' | 'rechazado') {
    void this.realizar(async () => {
      await this.api.enviar('PUT', '/verificaciones/documentos/' + d.id + '/revision', {
        estado,
        observacion: estado === 'aprobado' ? 'Documento renovado aprobado.' : 'Documento renovado rechazado.',
      });
      await this.cargar();
    });
  }

  revisar() {
    const v = this.seleccionado;
    if (!v) return;
    void this.realizar(async () => {
      await this.api.enviar('PUT', '/verificaciones/' + v.id + '/criterios', {
        criterio: this.criterio, estado: this.resultado, observaciones: this.observaciones,
      });
      await this.cargar();
    });
  }
  decidir() {
    const v = this.seleccionado;
    if (!v || !confirm('¿Registrar esta decisión de verificación?')) return;
    void this.realizar(async () => {
      await this.api.enviar('PUT', '/verificaciones/' + v.id + '/decision', { estado: this.decision, motivo: this.motivo });
      await this.cargar();
    });
  }
  presentar() {
    void this.realizar(async () => {
      await this.api.enviar('POST', '/reclamos/servicios/' + this.solicitudReclamo, {
        tipo: this.tipo, descripcion: this.descripcion,
      });
      this.descripcion = '';
      await this.cargar();
    });
  }
  retirar(r: Reclamo) {
    if (!confirm('¿Retirar este reclamo pendiente?')) return;
    void this.realizar(async () => {
      await this.api.enviar('DELETE', '/reclamos/' + r.id);
      await this.cargar();
    });
  }
  resolverReclamo() {
    if (!this.reclamo) return;
    const id = this.reclamo.id;
    void this.realizar(async () => {
      await this.api.enviar('PUT', '/reclamos/' + id + '/resolucion', { estado: this.estadoResolucion, resultado: this.resolucion });
      this.reclamo = null; this.resolucion = '';
      await this.cargar();
    });
  }
  resolverApelacion() {
    if (!this.apelacion) return;
    const id = this.apelacion.id;
    void this.realizar(async () => {
      await this.api.enviar('PUT', '/administracion/apelaciones/' + id, { estado: this.estadoApelacion, decision: this.resolucion });
      this.apelacion = null; this.resolucion = '';
      await this.cargar();
    });
  }
}
