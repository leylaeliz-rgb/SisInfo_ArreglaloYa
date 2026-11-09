import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ServiciosController } from './api/servicios.controller';
import { ServiciosTypeOrmRepository } from './infrastructure/consulta.typeorm-repository';
import { ConsultarServiciosService } from './services/consultar.service';

import { OperacionesServiciosController } from './api/operaciones.controller';
import { OperacionesServiciosTypeOrmRepository } from './infrastructure/operaciones.repository';
import { OperacionesServiciosService } from './services/operaciones.service';

@Module({
  imports: [AuthModule],
  controllers: [OperacionesServiciosController, ServiciosController],
  providers: [
    OperacionesServiciosTypeOrmRepository,
    {
      provide: OperacionesServiciosService,
      inject: [OperacionesServiciosTypeOrmRepository],
      useFactory: (repo: OperacionesServiciosTypeOrmRepository) => new OperacionesServiciosService(repo),
    },
    ServiciosTypeOrmRepository,
    {
      provide: ConsultarServiciosService,
      inject: [ServiciosTypeOrmRepository],
      useFactory: (repo: ServiciosTypeOrmRepository) => new ConsultarServiciosService(repo),
    },
  ],
})
export class ServiciosModule {}
