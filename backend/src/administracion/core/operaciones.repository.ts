export interface ResultadoAdministracion {
  id?: string;
  [campo: string]: unknown;
}

export interface OperacionesAdministracionRepository {
  revocarSuspension(usuarioId: string, recursoId: string): Promise<ResultadoAdministracion | undefined>;
}
