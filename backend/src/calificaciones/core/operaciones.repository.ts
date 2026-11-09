export interface ResultadoCalificaciones {
  id?: string;
  [campo: string]: unknown;
}

export interface OperacionesCalificacionesRepository {
  guardar(usuarioId: string, recursoId: string, estrellas: number, comentario: string): Promise<ResultadoCalificaciones | undefined>;
}
