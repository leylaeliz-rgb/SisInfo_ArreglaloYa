export interface ResultadoCatalogos {
  id?: string;
  [campo: string]: unknown;
}

export interface OperacionesCatalogosRepository {
  crearCategoria(usuarioId: string, codigo: string, nombre: string): Promise<ResultadoCatalogos | undefined>;
  editarCategoria(usuarioId: string, recursoId: string, nombre: string, activa: boolean): Promise<ResultadoCatalogos | undefined>;
  crearZona(usuarioId: string, nombre: string, tipo: string): Promise<ResultadoCatalogos | undefined>;
  editarZona(usuarioId: string, recursoId: string, nombre: string, activa: boolean): Promise<ResultadoCatalogos | undefined>;
}
