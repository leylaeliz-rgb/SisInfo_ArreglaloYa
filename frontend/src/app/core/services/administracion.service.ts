// core/services/administracion.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Incidencia, Suspension } from '../models/administracion.models';

@Injectable({ providedIn: 'root' })
export class AdministracionService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/administracion`;

  listarSuspensiones() { return this.http.get<Suspension[]>(`${this.base}/suspensiones`); }
  revocarSuspension(id: string) { return this.http.put(`${this.base}/suspensiones/${id}/revocacion`, {}); }

  listarIncidencias() { return this.http.get<Incidencia[]>(`${this.base}/incidencias`); }
  registrarIncidencia(trabajadorId: string, motivo: string) {
    return this.http.post(`${this.base}/incidencias`, { trabajadorId, motivo });
  }
  revisarIncidencia(id: string, estado: 'confirmada' | 'descartada', observaciones: string) {
    return this.http.patch(`${this.base}/incidencias/${id}`, { estado, observaciones });
  }
  aplicarSuspension(incidenciaId: string) {
    return this.http.post(`${this.base}/incidencias/${incidenciaId}/suspension`, {});
  }

  apelarVerificacion(id: string, motivo: string) {
    return this.http.post(`${this.base}/verificaciones/${id}/apelaciones`, { motivo });
  }
  apelarSuspension(id: string, motivo: string) {
    return this.http.post(`${this.base}/suspensiones/${id}/apelaciones`, { motivo });
  }
  resolverApelacion(id: string, estado: 'aceptada' | 'rechazada', decision: string) {
    return this.http.put(`${this.base}/apelaciones/${id}`, { estado, decision });
  }
}