export interface AdministracionRepository {
  listar(): Promise<Record<string, unknown>[]>;
}
