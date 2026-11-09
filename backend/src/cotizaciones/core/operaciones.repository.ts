export interface ResultadoCotizaciones {
  id?: string;
  [campo: string]: unknown;
}

export interface OperacionesCotizacionesRepository {
  enviar(usuarioId: string, recursoId: string, manoObra: string, materiales: string, transporte: string, requiereVisita: boolean): Promise<ResultadoCotizaciones | undefined>;
  retirar(usuarioId: string, recursoId: string): Promise<ResultadoCotizaciones | undefined>;
}
