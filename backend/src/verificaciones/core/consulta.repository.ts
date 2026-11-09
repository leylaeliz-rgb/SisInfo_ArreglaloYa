export interface VerificacionesRepository {
  listar(usuarioId: string): Promise<Record<string, unknown>[]>;
}
