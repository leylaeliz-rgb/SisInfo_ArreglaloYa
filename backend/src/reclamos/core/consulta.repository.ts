export interface ReclamosRepository {
  listar(usuarioId: string): Promise<Record<string, unknown>[]>;
}
