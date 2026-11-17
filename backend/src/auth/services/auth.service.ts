import { CredencialesInvalidas, CuentasAuth, Identidad, PasswordActualIncorrecta, RolNoAsignado, Seguridad, RevocacionesSesion } from '../core/seguridad';

export class AuthService {
  constructor(private readonly cuentas: CuentasAuth, private readonly seguridad: Seguridad, private readonly revocaciones: RevocacionesSesion) {}

  async registrar(nombre: string, telefono: string, password: string, rol: string) {
    return this.cuentas.crear(nombre, telefono, await this.seguridad.hash(password), rol);
  }

  async login(telefono: string, password: string) {
    const cuenta = await this.cuentas.credenciales(telefono);
    if (!cuenta || !cuenta.roles.length || !(await this.seguridad.comprobar(password, cuenta.passwordHash))) {
      throw new CredencialesInvalidas();
    }
    return this.emitir(cuenta.id, cuenta.roles.includes('cliente') ? 'cliente' : cuenta.roles[0]);
  }

  /** Reactiva una cuenta dada de baja voluntaria ('inactiva') y abre sesión. */
  async reactivar(telefono: string, password: string) {
    const cuenta = await this.cuentas.credencialesInactivas(telefono);
    if (
      !cuenta ||
      !(await this.seguridad.comprobar(password, cuenta.passwordHash)) ||
      !(await this.cuentas.reactivar(cuenta.id))
    ) {
      throw new CredencialesInvalidas();
    }
    return this.login(telefono, password);
  }

  async cambiarPassword(usuarioId: string, actual: string, nueva: string) {
    const hashActual = await this.cuentas.hashDe(usuarioId);
    if (!hashActual || !(await this.seguridad.comprobar(actual, hashActual))) {
      throw new PasswordActualIncorrecta();
    }
    const cambiada = await this.cuentas.cambiarHash(usuarioId, hashActual, await this.seguridad.hash(nueva));
    // false: la contraseña cambió entre la comprobación y la escritura; se pide repetir la operación.
    if (!cambiada) throw new PasswordActualIncorrecta();
  }

  async autenticar(token: string): Promise<Identidad> {
    const identidad = this.seguridad.verificar(token);
    if (!identidad || await this.revocaciones.existe(identidad.sesionId)) throw new CredencialesInvalidas();
    const cuenta = await this.cuentas.buscar(identidad.sub);
    if (!cuenta?.roles.includes(identidad.rolActivo)) throw new CredencialesInvalidas();
    return { ...identidad, roles: cuenta.roles };
  }

  cambiarRol(identidad: Identidad, rol: string) {
    if (!identidad.roles.includes(rol)) throw new RolNoAsignado();
    return {
      accessToken: this.seguridad.emitir(identidad.sub, rol, identidad),
      rolActivo: rol,
      expiresIn: Math.max(0, identidad.expiraEn - Math.floor(Date.now() / 1000)),
    };
  }

  cerrarSesion(identidad: Identidad) {
    return this.revocaciones.registrar(identidad.sesionId, identidad.expiraEn);
  }

  private emitir(id: string, rolActivo: string) {
    return { accessToken: this.seguridad.emitir(id, rolActivo), rolActivo, expiresIn: 900 };
  }
}
