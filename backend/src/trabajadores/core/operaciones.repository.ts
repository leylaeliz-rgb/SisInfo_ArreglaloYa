export interface ResultadoTrabajadores {
  id?: string;
  [campo: string]: unknown;
}

export interface OperacionesTrabajadoresRepository {
  cambiarDisponibilidad(usuarioId: string, disponible: boolean): Promise<ResultadoTrabajadores | undefined>;
}
