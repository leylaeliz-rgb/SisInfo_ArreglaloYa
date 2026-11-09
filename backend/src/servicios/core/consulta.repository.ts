export interface ServiciosRepository {
  listar(usuarioId: string): Promise<Record<string, unknown>[]>;
}
