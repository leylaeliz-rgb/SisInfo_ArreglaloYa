export interface ResultadoAdministracion {
  id?: string;
  [campo: string]: unknown;
}

export interface OperacionesAdministracionRepository {
  revocarSuspension(usuarioId: string, recursoId: string): Promise<ResultadoAdministracion | undefined>;

  registrarIncidencia(usuarioId: string, trabajadorId: string, motivo: string): Promise<ResultadoAdministracion | undefined>;

  listarIncidencias(): Promise<ResultadoAdministracion[]>;

  revisarIncidencia(usuarioId: string, incidenciaId: string, estado: string, observaciones: string): Promise<ResultadoAdministracion | undefined>;
  aplicarSuspension(usuarioId: string, incidenciaId: string): Promise<ResultadoAdministracion | undefined>;

  apelarVerificacion(usuarioId: string, recursoId: string, motivo: string): Promise<ResultadoAdministracion | undefined>;
  apelarSuspension(usuarioId: string, recursoId: string, motivo: string): Promise<ResultadoAdministracion | undefined>;
  resolverApelacion(usuarioId: string, recursoId: string, estado: string, decision: string): Promise<ResultadoAdministracion | undefined>;
}
