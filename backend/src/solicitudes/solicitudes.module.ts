import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SolicitudesController } from './api/solicitudes.controller';
import { SolicitudesTypeOrmRepository } from './infrastructure/consulta.typeorm-repository';
import { ConsultarSolicitudesService } from './services/consultar.service';

import { OperacionesSolicitudesController } from './api/operaciones.controller';
import { OperacionesSolicitudesTypeOrmRepository } from './infrastructure/operaciones.repository';
import { OperacionesSolicitudesService } from './services/operaciones.service';

@Module({
  imports: [AuthModule],
  controllers: [OperacionesSolicitudesController, SolicitudesController],
  providers: [
    OperacionesSolicitudesTypeOrmRepository,
    {
      provide: OperacionesSolicitudesService,
      inject: [OperacionesSolicitudesTypeOrmRepository],
      useFactory: (repo: OperacionesSolicitudesTypeOrmRepository) => new OperacionesSolicitudesService(repo),
    },
    SolicitudesTypeOrmRepository,
    {
      provide: ConsultarSolicitudesService,
      inject: [SolicitudesTypeOrmRepository],
      useFactory: (repo: SolicitudesTypeOrmRepository) => new ConsultarSolicitudesService(repo),
    },
  ],
})
export class SolicitudesModule {}
