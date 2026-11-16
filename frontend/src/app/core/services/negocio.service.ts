import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Categoria { id: string; codigo: string; nombre: string; descripcion: string | null; }
export interface Zona { id: string; nombre: string; tipo: string; zonaPadreId: string | null; }
export interface Cotizacion {
  id: string; solicitud_id: string; trabajador_id: string;
  monto_estimado_total: string | number; moneda: string; estado: string;
}
export interface Calificacion {
  id: string; servicio_id: string; estrellas: number; comentario: string; actualizada_en: string;
}
export interface Reputacion { total: number; promedio: number | null; }
export interface EvaluacionInterna { valoracion: number; descripcion: string; creada_en: string; }

@Injectable({ providedIn: 'root' })
export class NegocioService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  categorias() { return this.http.get<Categoria[]>(`${this.base}/catalogos/categorias`); }
  zonas() { return this.http.get<Zona[]>(`${this.base}/catalogos/zonas`); }
  crearCategoria(codigo: string, nombre: string) {
    return this.http.post(`${this.base}/catalogos/categorias`, { codigo, nombre });
  }
  editarCategoria(id: string, nombre: string, activa: boolean) {
    return this.http.patch(`${this.base}/catalogos/categorias/${id}`, { nombre, activa });
  }
  crearZona(nombre: string, tipo: 'zona' | 'otb' | 'macrodistrito') {
    return this.http.post(`${this.base}/catalogos/zonas`, { nombre, tipo });
  }
  editarZona(id: string, nombre: string, activa: boolean) {
    return this.http.patch(`${this.base}/catalogos/zonas/${id}`, { nombre, activa });
  }

  cotizaciones() { return this.http.get<Cotizacion[]>(`${this.base}/cotizaciones/me`); }
  enviarCotizacion(id: string, manoObra: number, materiales: number, transporte: number, requiereVisita: boolean) {
    return this.http.post(`${this.base}/cotizaciones/solicitudes/${id}`, { manoObra, materiales, transporte, requiereVisita });
  }
  retirarCotizacion(id: string) { return this.http.put(`${this.base}/cotizaciones/${id}/retiro`, {}); }
  editarCondiciones(id: string, condiciones: string) {
    return this.http.patch(`${this.base}/cotizaciones/${id}`, { condiciones });
  }

  calificaciones() { return this.http.get<Calificacion[]>(`${this.base}/calificaciones/me`); }
  guardarCalificacion(servicioId: string, estrellas: number, comentario: string) {
    return this.http.put(`${this.base}/calificaciones/${servicioId}`, { estrellas, comentario });
  }
  retirarCalificacion(servicioId: string) { return this.http.delete(`${this.base}/calificaciones/${servicioId}`); }
  reputacion(trabajadorId: string) {
    return this.http.get<Reputacion>(`${this.base}/calificaciones/trabajadores/${trabajadorId}`);
  }
  evaluarCliente(servicioId: string, valoracion: number, descripcion: string) {
    return this.http.put(`${this.base}/calificaciones/servicios/${servicioId}/evaluacion-interna`, { valoracion, descripcion });
  }
  referenciasCliente(clienteId: string) {
    return this.http.get<EvaluacionInterna[]>(`${this.base}/calificaciones/clientes/${clienteId}/evaluaciones-internas`);
  }
}
