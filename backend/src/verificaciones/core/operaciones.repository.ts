export interface ResultadoVerificaciones {
  id?: string;
  [campo: string]: unknown;
}

export interface OperacionesVerificacionesRepository {
  solicitar(usuarioId: string): Promise<ResultadoVerificaciones | undefined>;
  decidir(usuarioId: string, recursoId: string, estado: string, motivo: string): Promise<ResultadoVerificaciones | undefined>;
}
