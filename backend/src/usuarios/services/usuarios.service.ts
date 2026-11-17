import { CuentasRepository } from '../core/cuenta';

export class UsuariosService {
  constructor(private readonly cuentas: CuentasRepository) {}

  buscar(id: string) {
    return this.cuentas.buscar(id);
  }

  credenciales(telefono: string) {
    return this.cuentas.credenciales(telefono);
  }

  crear(nombre: string, telefono: string, hash: string, rol: string) {
    return this.cuentas.crear(nombre, telefono, hash, rol);
  }

  hashDe(id: string) {
    return this.cuentas.hashDe(id);
  }

  cambiarHash(id: string, hashAnterior: string, hashNuevo: string) {
    return this.cuentas.cambiarHash(id, hashAnterior, hashNuevo);
  }

  credencialesInactivas(telefono: string) {
    return this.cuentas.credencialesInactivas(telefono);
  }

  reactivar(id: string) {
    return this.cuentas.reactivar(id);
  }
}
