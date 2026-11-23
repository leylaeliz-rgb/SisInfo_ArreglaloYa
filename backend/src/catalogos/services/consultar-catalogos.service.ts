import type { CatalogosRepository, Categoria, Zona } from '../core/catalogos.repository';

export class ConsultarCatalogosService {
  constructor(private readonly catalogos: CatalogosRepository) {}

  listarCategorias(): Promise<Categoria[]> {
    return this.catalogos.listarCategorias();
  }

  listarZonas(): Promise<Zona[]> {
    return this.catalogos.listarZonas();
  }
}