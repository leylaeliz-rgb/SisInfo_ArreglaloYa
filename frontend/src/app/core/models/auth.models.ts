
export type Rol = 'cliente' | 'trabajador' | 'administrador';

export interface Cuenta {
  id: string;
  nombreCompleto: string;
  telefono: string;
  roles: Rol[];
}

export interface LoginDto { telefono: string; password: string; }

export interface RegistroDto {
  nombreCompleto: string;
  telefono: string;
  password: string;
  rol: 'cliente' | 'trabajador';
}

export interface Sesion {
  accessToken: string;
  rolActivo: Rol;
  expiresIn: number;
}