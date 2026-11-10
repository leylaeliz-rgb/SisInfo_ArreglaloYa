export interface ResultadoVerificaciones {
  id?: string;
  [campo: string]: unknown;
}

export interface OperacionesVerificacionesRepository {
  solicitar(usuarioId: string): Promise<ResultadoVerificaciones | undefined>;
  decidir(usuarioId: string, recursoId: string, estado: string, motivo: string): Promise<ResultadoVerificaciones | undefined>;

  retirarSolicitud(usuarioId: string, recursoId: string): Promise<ResultadoVerificaciones | undefined>;

  registrarCriterio(usuarioId: string, recursoId: string, criterio: string, estado: string, observaciones: string): Promise<ResultadoVerificaciones | undefined>;
}
