export interface Identidad {
  sub: string;
  sesionId: string;
  expiraEn: number;
  roles: string[];
  rolActivo: string;
}

export interface Seguridad {
  hash(password: string): Promise<string>;
  comprobar(password: string, hash: string): Promise<boolean>;
  emitir(sub: string, rolActivo: string, sesion?: Pick<Identidad, 'sesionId' | 'expiraEn'>): string;
  verificar(token: string): Omit<Identidad, 'roles'> | null;
}

export interface CuentasAuth {
  buscar(id: string): Promise<{ id: string; roles: string[] } | undefined>;
  credenciales(telefono: string): Promise<{ id: string; roles: string[]; passwordHash: string } | undefined>;
  crear(nombre: string, telefono: string, hash: string, rol: string): Promise<{ id: string; roles: string[] }>;
}

export class CredencialesInvalidas extends Error {}
export class RolNoAsignado extends Error {}

export interface RevocacionesSesion {
  existe(sesionId: string): Promise<boolean>;
  registrar(sesionId: string, expiraEn: number): Promise<void>;
}
