import { Module } from '@nestjs/common';
import { CatalogosController } from './api/catalogos.controller';
import { CatalogosTypeOrmRepository } from './infrastructure/catalogos.typeorm-repository';
import { ConsultarCatalogosService } from './services/consultar-catalogos.service';

import { OperacionesCatalogosController } from './api/operaciones.controller';
import { OperacionesCatalogosTypeOrmRepository } from './infrastructure/operaciones.repository';
import { OperacionesCatalogosService } from './services/operaciones.service';

@Module({
  controllers: [OperacionesCatalogosController, CatalogosController],
  providers: [
    OperacionesCatalogosTypeOrmRepository,
    {
      provide: OperacionesCatalogosService,
      inject: [OperacionesCatalogosTypeOrmRepository],
      useFactory: (repo: OperacionesCatalogosTypeOrmRepository) => new OperacionesCatalogosService(repo),
    },
    CatalogosTypeOrmRepository,
    {
      provide: ConsultarCatalogosService,
      inject: [CatalogosTypeOrmRepository],
      useFactory: (repositorio: CatalogosTypeOrmRepository) => new ConsultarCatalogosService(repositorio),
    },
  ],
  exports: [ConsultarCatalogosService],
})
export class CatalogosModule {}
