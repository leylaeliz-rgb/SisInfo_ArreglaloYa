export interface ResultadoReclamos {
  id?: string;
  [campo: string]: unknown;
}

export interface OperacionesReclamosRepository {
  presentar(usuarioId: string, recursoId: string, descripcion: string, tipo: string): Promise<ResultadoReclamos | undefined>;
  resolver(usuarioId: string, recursoId: string, estado: string, resultado: string): Promise<ResultadoReclamos | undefined>;

  retirar(usuarioId: string, recursoId: string): Promise<ResultadoReclamos | undefined>;
}
