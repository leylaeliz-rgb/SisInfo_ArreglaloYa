import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Opcion { id: string; nombre: string; codigo?: string; tipo?: string; }
export interface Franja { dia: number; inicio: string; fin: string; }
export interface Profesional {
  id: string; descripcion: string | null; zona_base_id: string; disponible: boolean;
  estado_verificacion: string; categorias: string[]; zonas: string[]; franjas: Franja[];
}
export interface Documento {
  id: string;
  tipo: string;
  nombre: string;
  fechaVencimiento?: string | null;
  estadoRevision?: string;
  estadoVigencia?: 'vigente' | 'por_vencer' | 'vencido' | 'reemplazado';
  diasRestantes?: number | null;
  obligatorio?: boolean;
}
export interface AlertaDocumento {
  documento_id: string;
  trabajador_id: string;
  trabajador: string;
  tipo_documento: string;
  nombre_tipo: string;
  nombre_archivo: string;
  obligatorio: boolean;
  estado_revision: string;
  fecha_vencimiento: string | null;
  dias_restantes: number | null;
  estado_vigencia: 'vigente' | 'por_vencer' | 'vencido';
}
export interface Verificacion {
  id: string; estado: string; motivo_decision: string | null; nombre_completo: string;
  documentos: Documento[]; criterios: { criterio: string; resultado: string; observaciones: string }[];
}
export interface Solicitud {
  id: string; titulo: string; descripcion: string; estado?: string; categoria_id: string;
  zona_id: string; urgente: boolean;
}
export interface Trabajador {
  id: string; nombre_completo: string; descripcion: string | null;
  zona_base_id: string; zona: string; especialidades: string[];
}
export interface Precio { id: string; tipo: string; estado: string; total: string; justificacion: string | null; }
export interface Pago { id: string; tipo: string; estado: string; monto: string; metodo: string; }
export interface Servicio {
  id: string; estado: string; cliente_id: string; trabajador_id: string; titulo: string;
  cliente: string; trabajador: string; fecha_visita: string | null;
  total_acordado: string | null; monto_anticipo: string | null; monto_saldo: string | null;
  monto_comision: string | null; precios: Precio[]; pagos: Pago[];
}
export interface Oferta {
  id: string; solicitud_id: string; trabajador_id: string; trabajador: string; cliente_id: string;
  titulo: string; estado: string; estado_solicitud: string; monto_estimado_total: string; moneda: string;
  condiciones: string | null;
}
export interface Reclamo {
  id: string; servicio_id: string; titulo: string; descripcion: string; tipo: string;
  estado: string; resultado: string | null; cliente: string;
}
export interface Apelacion {
  id: string; estado: string; motivo: string; decision: string | null; nombre_completo: string;
  suspension_id: string | null; solicitud_verificacion_id: string | null;
}
export interface Suspension {
  id: string; estado: string; motivo: string; duracion_dias: number; inicia_en: string; termina_en: string;
}

@Injectable({ providedIn: 'root' })
export class ProyectoApi {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  get<T>(ruta: string): Promise<T> {
    return firstValueFrom(this.http.get<T>(this.base + ruta));
  }

  enviar<T = unknown>(metodo: 'POST' | 'PUT' | 'PATCH' | 'DELETE', ruta: string, body?: unknown): Promise<T> {
    return firstValueFrom(this.http.request<T>(metodo, this.base + ruta, { body }));
  }

  async descargar(id: string) {
    const archivo = await firstValueFrom(this.http.get(this.base + '/verificaciones/documentos/' + id, { responseType: 'blob' }));
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'documento-' + id;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
