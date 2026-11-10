export interface ResultadoTrabajadores {
  id?: string;
  [campo: string]: unknown;
}

export interface OperacionesTrabajadoresRepository {
  cambiarDisponibilidad(usuarioId: string, disponible: boolean): Promise<ResultadoTrabajadores | undefined>;

  retirarPerfil(usuarioId: string): Promise<ResultadoTrabajadores | undefined>;

  buscar(usuarioId: string): Promise<ResultadoTrabajadores[]>;

  pausar(usuarioId: string, dias: number): Promise<ResultadoTrabajadores | undefined>;
  reactivar(usuarioId: string): Promise<ResultadoTrabajadores | undefined>;
}
