export interface ResultadoUsuarios {
  id?: string;
  [campo: string]: unknown;
}

export class ServiciosAbiertos extends Error {}

export interface OperacionesUsuariosRepository {
  actualizarPerfil(usuarioId: string, nombreCompleto: string): Promise<ResultadoUsuarios | undefined>;

  /** Lanza ServiciosAbiertos si la cuenta participa en servicios sin finalizar ni cancelar. */
  desactivar(usuarioId: string): Promise<ResultadoUsuarios | undefined>;

  inscribirseComoTrabajador(usuarioId: string): Promise<ResultadoUsuarios | undefined>;

  aceptarTerminos(usuarioId: string, version: string, ip: string | null): Promise<ResultadoUsuarios | undefined>;

  terminosAceptados(usuarioId: string): Promise<ResultadoUsuarios[]>;
}
