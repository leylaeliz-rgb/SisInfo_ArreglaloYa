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

  cancelarAntesDeIniciar(usuarioId: string, recursoId: string): Promise<ResultadoServicios | undefined>;

  agendar(usuarioId: string, recursoId: string, fecha: string): Promise<ResultadoServicios | undefined>;

  contacto(usuarioId: string, recursoId: string): Promise<ResultadoServicios | undefined>;

  rechazarPrecio(usuarioId: string, recursoId: string, propuestaId: string): Promise<ResultadoServicios | undefined>;

  proponerIncremento(usuarioId: string, recursoId: string, manoObra: string, materiales: string, justificacion: string): Promise<ResultadoServicios | undefined>;

  aceptarIncremento(usuarioId: string, recursoId: string, propuestaId: string): Promise<ResultadoServicios | undefined>;

  cancelarPorTrabajador(usuarioId: string, recursoId: string, motivo: string): Promise<ResultadoServicios | undefined>;
}
