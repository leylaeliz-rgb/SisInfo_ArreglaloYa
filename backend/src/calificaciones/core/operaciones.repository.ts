export interface ResultadoCalificaciones {
  id?: string;
  [campo: string]: unknown;
}

export interface OperacionesCalificacionesRepository {
  guardar(usuarioId: string, recursoId: string, estrellas: number, comentario: string): Promise<ResultadoCalificaciones | undefined>;

  retirar(usuarioId: string, recursoId: string): Promise<ResultadoCalificaciones | undefined>;

  reputacion(usuarioId: string, recursoId: string): Promise<ResultadoCalificaciones | undefined>;

  evaluarCliente(usuarioId: string, recursoId: string, valoracion: number, descripcion: string): Promise<ResultadoCalificaciones | undefined>;

  referenciasCliente(usuarioId: string, recursoId: string): Promise<ResultadoCalificaciones[]>;
}
