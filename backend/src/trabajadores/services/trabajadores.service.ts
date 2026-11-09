import {
  DatosPerfilTrabajador,
  PerfilesTrabajadorRepository,
  PerfilTrabajadorNoEncontrado,
} from '../core/perfil-trabajador';

export class TrabajadoresService {
  constructor(private readonly perfiles: PerfilesTrabajadorRepository) {}

  async consultarPerfil(usuarioId: string) {
    const perfil = await this.perfiles.buscar(usuarioId);
    if (!perfil) {
      throw new PerfilTrabajadorNoEncontrado('El perfil de trabajador todavía no existe.');
    }

    return perfil;
  }

  async guardarPerfil(usuarioId: string, datos: DatosPerfilTrabajador) {
    await this.perfiles.guardar(usuarioId, datos);
    return this.consultarPerfil(usuarioId);
  }
}
