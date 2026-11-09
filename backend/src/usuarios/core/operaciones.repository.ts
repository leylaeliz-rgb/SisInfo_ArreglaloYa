export interface ResultadoUsuarios {
  id?: string;
  [campo: string]: unknown;
}

export interface OperacionesUsuariosRepository {
  actualizarPerfil(usuarioId: string, nombreCompleto: string): Promise<ResultadoUsuarios | undefined>;
}
