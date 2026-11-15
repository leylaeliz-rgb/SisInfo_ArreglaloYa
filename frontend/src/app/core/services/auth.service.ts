// core/services/auth.service.ts
import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cuenta, LoginDto, RegistroDto, Rol, Sesion } from '../models/auth.models';

const CLAVE_TOKEN = 'token';
const CLAVE_ROL = 'rolActivo';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/auth`;

  private _token = signal<string | null>(sessionStorage.getItem(CLAVE_TOKEN));
  private _rolActivo = signal<Rol | null>(sessionStorage.getItem(CLAVE_ROL) as Rol | null);

  readonly token = this._token.asReadonly();
  readonly rolActivo = this._rolActivo.asReadonly();
  readonly autenticado = computed(() => this._token() !== null);

  registrar(dto: RegistroDto) {
    return this.http.post<Cuenta>(`${this.base}/register`, dto);
  }

  login(dto: LoginDto) {
    return this.http.post<Sesion>(`${this.base}/login`, dto).pipe(tap((s) => this.guardar(s)));
  }

  cambiarRol(rol: Rol) {
    return this.http.patch<Sesion>(`${this.base}/active-role`, { rol }).pipe(tap((s) => this.guardar(s)));
  }

  logout() {
    return this.http.post<void>(`${this.base}/logout`, {}).pipe(finalize(() => this.limpiarSesion()));
  }

  limpiarSesion() {
    sessionStorage.removeItem(CLAVE_TOKEN);
    sessionStorage.removeItem(CLAVE_ROL);
    this._token.set(null);
    this._rolActivo.set(null);
  }

  private guardar(s: Sesion) {
    sessionStorage.setItem(CLAVE_TOKEN, s.accessToken);
    sessionStorage.setItem(CLAVE_ROL, s.rolActivo);
    this._token.set(s.accessToken);
    this._rolActivo.set(s.rolActivo);
  }
}