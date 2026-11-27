
export interface ConfiguracionEscalamiento {
  plazoAtencionHoras: number;
  actualizadoEn: string;
  actualizadoPor: string | null;
}

export interface ConfiguracionEscalamientoRepository {

  obtener(): Promise<
    ConfiguracionEscalamiento | undefined
  >;

  actualizar(
    usuarioId: string,
    plazoHoras: number
  ): Promise<ConfiguracionEscalamiento | undefined>;

}

//define que operaciones debe ofrece una clase, no contiene las consultas sql q las ejecutan