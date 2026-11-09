import { Module } from '@nestjs/common';
import { CatalogosController } from './api/catalogos.controller';
import { CatalogosTypeOrmRepository } from './infrastructure/catalogos.typeorm-repository';
import { ConsultarCatalogosService } from './services/consultar-catalogos.service';

@Module({
  controllers: [CatalogosController],
  providers: [
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
