// core/services/usuarios.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Cuenta, Rol } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/usuarios/me`;

  consultar() {
    return this.http.get<Cuenta>(this.base, {
      params: { actualizado: Date.now().toString() },
    });
  }
  roles() { return this.http.get<Rol[]>(`${this.base}/roles`); }
  actualizarPerfil(nombreCompleto: string) { return this.http.patch(this.base, { nombreCompleto }); }
  desactivar() { return this.http.delete(this.base); }
  inscribirseComoTrabajador() { return this.http.post(`${this.base}/inscripcion-trabajador`, {}); }
}
