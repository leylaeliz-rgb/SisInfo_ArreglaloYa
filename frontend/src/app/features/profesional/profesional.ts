import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Pantalla } from '../../shared/pantalla';
import { Feedback } from '../../shared/feedback';
import { Opcion, Profesional, Verificacion, Suspension, Franja } from '../../core/services/proyecto-api.service';

@Component({
  imports: [FormsModule, Feedback],
  templateUrl: './profesional.html',
})
export class PerfilProfesional extends Pantalla implements OnInit {
  categorias: Opcion[] = [];
  zonas: Opcion[] = [];
  perfil: Profesional | null = null;
  verificaciones: Verificacion[] = [];
  suspensiones: Suspension[] = [];
  descripcion = '';
  zona = '';
  especialidades: string[] = [];
  cobertura: string[] = [];
  franjas: Franja[] = [];
  dias = 7;
  tipo = 'identidad';
  archivo: File | null = null;
  motivo = '';
  readonly tipos = ['identidad', 'antecedentes', 'habilidades', 'referencias_reputacion'];
  readonly semana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  ngOnInit() { void this.realizar(() => this.cargar(), ''); }

  async cargar() {
    const [categorias, zonas, perfiles, verificaciones, suspensiones] = await Promise.all([
      this.api.get<Opcion[]>('/catalogos/categorias'), this.api.get<Opcion[]>('/catalogos/zonas'),
      this.api.get<Profesional[]>('/panel/trabajador'),
      this.api.get<Verificacion[]>('/panel/verificaciones'), this.api.get<Suspension[]>('/panel/suspensiones'),
    ]);
    this.categorias = categorias;
    this.zonas = zonas;
    this.perfil = perfiles[0] ?? null;
    this.verificaciones = verificaciones;
    this.suspensiones = suspensiones;
    this.descripcion = this.perfil?.descripcion ?? '';
    this.zona = this.perfil?.zona_base_id ?? '';
    this.especialidades = this.perfil?.categorias ?? [];
    this.cobertura = this.perfil?.zonas ?? [];
    this.franjas = this.perfil?.franjas ?? [];
  }

  guardarPerfil() {
    void this.realizar(async () => {
      await this.api.enviar('PUT', '/trabajadores/me/perfil', { zonaBaseId: this.zona, descripcion: this.descripcion });
      await this.cargar();
    });
  }

  guardarConfiguracion(tipo: 'especialidades' | 'cobertura' | 'horarios') {
    const cuerpo = tipo === 'especialidades' ? { categoriaIds: this.especialidades } :
      tipo === 'cobertura' ? { zonaIds: this.cobertura } : { franjas: this.franjas };
    void this.realizar(async () => {
      await this.api.enviar('PUT', '/trabajadores/me/' + tipo, cuerpo);
      await this.cargar();
    });
  }

  disponibilidad() {
    void this.realizar(async () => {
      await this.api.enviar('PUT', '/trabajadores/me/disponibilidad', { disponible: !this.perfil?.disponible });
      await this.cargar();
    });
  }

  pausar() {
    if (!confirm('Tu perfil dejará de recibir trabajos durante la pausa. ¿Continuar?')) return;
    void this.realizar(async () => {
      await this.api.enviar('POST', '/trabajadores/me/pausas', { dias: this.dias });
      await this.cargar();
    });
  }

  reactivar() {
    void this.realizar(async () => {
      await this.api.enviar('PUT', '/trabajadores/me/pausas/reactivacion');
      await this.cargar();
    }, 'Pausa cerrada. Puedes habilitar tu disponibilidad si cumples los requisitos.');
  }

  solicitar() {
    void this.realizar(async () => {
      await this.api.enviar('POST', '/verificaciones');
      await this.cargar();
    });
  }

  seleccionar(evento: Event) {
    this.archivo = (evento.target as HTMLInputElement).files?.[0] ?? null;
  }

  subir(id: string) {
    const archivo = this.archivo;
    if (!archivo || archivo.size > 2097152) {
      this.error.set('Selecciona un PDF, PNG o JPEG de hasta 2 MiB.');
      return;
    }
    void this.realizar(async () => {
      const datos = new FormData();
      datos.append('tipo', this.tipo);
      datos.append('archivo', archivo);
      await this.api.enviar('POST', '/verificaciones/' + id + '/documentos', datos);
      await this.cargar();
    });
  }

  apelar(tipo: 'verificaciones' | 'suspensiones', id: string) {
    if (!this.motivo.trim()) { this.error.set('Describe el motivo de tu apelación.'); return; }
    void this.realizar(() => this.api.enviar('POST', '/administracion/' + tipo + '/' + id + '/apelaciones',
      { motivo: this.motivo }), 'Apelación presentada. Puedes seguirla en Incidencias.');
  }
}
