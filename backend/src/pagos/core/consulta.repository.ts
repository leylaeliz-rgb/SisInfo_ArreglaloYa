export interface PagosRepository {
  listar(usuarioId: string): Promise<Record<string, unknown>[]>;
}
