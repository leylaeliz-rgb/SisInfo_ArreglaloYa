export interface Categoria {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
}

export interface Zona {
  id: string;
  nombre: string;
  tipo: string;
  zonaPadreId: string | null;
}

export interface CatalogosRepository {
  listarCategorias(): Promise<Categoria[]>;
  listarZonas(): Promise<Zona[]>;
}
