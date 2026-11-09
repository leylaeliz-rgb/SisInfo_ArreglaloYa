export interface PerfilTrabajador {
  usuarioId: string;
  zonaBaseId: string;
  descripcion: string | null;
  estadoVerificacion: string;
  disponible: boolean;
  actualizadoEn: Date;
}

export interface DatosPerfilTrabajador {
  zonaBaseId: string;
  descripcion: string | null;
}

export const PERFILES_TRABAJADOR = Symbol('PERFILES_TRABAJADOR');

export interface PerfilesTrabajadorRepository {
  buscar(usuarioId: string): Promise<PerfilTrabajador | null>;
  guardar(usuarioId: string, datos: DatosPerfilTrabajador): Promise<void>;
}

export class PerfilTrabajadorNoEncontrado extends Error {}
export class ZonaBaseNoEncontrada extends Error {}
