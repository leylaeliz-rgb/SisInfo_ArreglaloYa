import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CotizacionesController } from './api/cotizaciones.controller';
import { CotizacionesTypeOrmRepository } from './infrastructure/consulta.typeorm-repository';
import { ConsultarCotizacionesService } from './services/consultar.service';

import { OperacionesCotizacionesController } from './api/operaciones.controller';
import { OperacionesCotizacionesTypeOrmRepository } from './infrastructure/operaciones.repository';
import { OperacionesCotizacionesService } from './services/operaciones.service';

@Module({
  imports: [AuthModule],
  controllers: [OperacionesCotizacionesController, CotizacionesController],
  providers: [
    OperacionesCotizacionesTypeOrmRepository,
    {
      provide: OperacionesCotizacionesService,
      inject: [OperacionesCotizacionesTypeOrmRepository],
      useFactory: (repo: OperacionesCotizacionesTypeOrmRepository) => new OperacionesCotizacionesService(repo),
    },
    CotizacionesTypeOrmRepository,
    {
      provide: ConsultarCotizacionesService,
      inject: [CotizacionesTypeOrmRepository],
      useFactory: (repo: CotizacionesTypeOrmRepository) => new ConsultarCotizacionesService(repo),
    },
  ],
})
export class CotizacionesModule {}
