export interface CotizacionesRepository {
  listar(usuarioId: string): Promise<Record<string, unknown>[]>;
}
