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

  /** Hash de la contraseña de una cuenta activa. */
  hashDe(id: string): Promise<string | undefined>;
  /** Cambia el hash solo si sigue siendo el anterior (evita pisar un cambio simultáneo). */
  cambiarHash(id: string, hashAnterior: string, hashNuevo: string): Promise<boolean>;
  /** Credenciales de una cuenta en estado 'inactiva' (baja voluntaria). */
  credencialesInactivas(telefono: string): Promise<{ id: string; passwordHash: string } | undefined>;
  /** Pasa de 'inactiva' a 'activa'. Devuelve false si la cuenta ya no estaba inactiva. */
  reactivar(id: string): Promise<boolean>;
}
