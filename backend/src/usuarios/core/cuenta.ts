export interface Cuenta {
  id: string;
  nombreCompleto: string;
  telefono: string;
  roles: string[];
}

export class TelefonoDuplicado extends Error {}

export interface CuentasRepository {
  buscar(id: string): Promise<Cuenta | undefined>;
  credenciales(telefono: string): Promise<(Cuenta & { passwordHash: string }) | undefined>;
  crear(nombre: string, telefono: string, hash: string, rol: string): Promise<Cuenta>;
}
