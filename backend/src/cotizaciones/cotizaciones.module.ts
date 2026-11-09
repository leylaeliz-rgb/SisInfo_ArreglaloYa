import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CotizacionesController } from './api/cotizaciones.controller';
import { CotizacionesTypeOrmRepository } from './infrastructure/consulta.typeorm-repository';
import { ConsultarCotizacionesService } from './services/consultar.service';

@Module({
  imports: [AuthModule],
  controllers: [CotizacionesController],
  providers: [
    CotizacionesTypeOrmRepository,
    {
      provide: ConsultarCotizacionesService,
      inject: [CotizacionesTypeOrmRepository],
      useFactory: (repo: CotizacionesTypeOrmRepository) => new ConsultarCotizacionesService(repo),
    },
  ],
})
export class CotizacionesModule {}
