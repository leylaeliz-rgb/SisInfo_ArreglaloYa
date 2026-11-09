import { CatalogosRepository } from '../core/catalogos.repository';

export class ConsultarCatalogosService {
  constructor(private readonly catalogos: CatalogosRepository) {}

  listarCategorias() {
    return this.catalogos.listarCategorias();
  }

  listarZonas() {
    return this.catalogos.listarZonas();
  }
}
