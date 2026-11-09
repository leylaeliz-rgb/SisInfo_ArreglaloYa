export interface ResultadoServicios {
  id?: string;
  [campo: string]: unknown;
}

export interface OperacionesServiciosRepository {
  contratar(usuarioId: string, recursoId: string): Promise<ResultadoServicios | undefined>;
  finalizar(usuarioId: string, recursoId: string): Promise<ResultadoServicios | undefined>;

  proponerPrecio(usuarioId: string, recursoId: string, manoObra: string, materiales: string, transporte: string): Promise<ResultadoServicios | undefined>;
  aceptarPrecio(usuarioId: string, recursoId: string, propuestaId: string): Promise<ResultadoServicios | undefined>;
  iniciar(usuarioId: string, recursoId: string): Promise<ResultadoServicios | undefined>;
}
