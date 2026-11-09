import { Controller, Get } from '@nestjs/common';
import { ConsultarCatalogosService } from '../services/consultar-catalogos.service';

@Controller('catalogos')
export class CatalogosController {
  constructor(private readonly catalogos: ConsultarCatalogosService) {}

  @Get('categorias')
  listarCategorias() {
    return this.catalogos.listarCategorias();
  }

  @Get('zonas')
  listarZonas() {
    return this.catalogos.listarZonas();
  }
}
