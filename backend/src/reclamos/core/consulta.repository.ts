export interface ReclamosRepository {
  listar(usuarioId: string, rolActivo: string): Promise<Record<string, unknown>[]>;
}
