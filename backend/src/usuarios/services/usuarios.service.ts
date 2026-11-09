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
}
