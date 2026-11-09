export interface CalificacionesRepository {
  listar(usuarioId: string): Promise<Record<string, unknown>[]>;
}
