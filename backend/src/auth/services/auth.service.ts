import { CredencialesInvalidas, CuentasAuth, Identidad, RolNoAsignado, Seguridad } from '../core/seguridad';

export class AuthService {
  constructor(private readonly cuentas: CuentasAuth, private readonly seguridad: Seguridad) {}

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

  async autenticar(token: string): Promise<Identidad> {
    const identidad = this.seguridad.verificar(token);
    if (!identidad) throw new CredencialesInvalidas();
    const cuenta = await this.cuentas.buscar(identidad.sub);
    if (!cuenta?.roles.includes(identidad.rolActivo)) throw new CredencialesInvalidas();
    return { ...identidad, roles: cuenta.roles };
  }

  cambiarRol(identidad: Identidad, rol: string) {
    if (!identidad.roles.includes(rol)) throw new RolNoAsignado();
    return this.emitir(identidad.sub, rol);
  }

  private emitir(id: string, rolActivo: string) {
    return { accessToken: this.seguridad.emitir(id, rolActivo), rolActivo, expiresIn: 900 };
  }
}
