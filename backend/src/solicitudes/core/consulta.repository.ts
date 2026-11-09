export interface SolicitudesRepository {
  listar(usuarioId: string): Promise<Record<string, unknown>[]>;
}
