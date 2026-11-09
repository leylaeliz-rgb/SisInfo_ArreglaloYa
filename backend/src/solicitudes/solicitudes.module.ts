import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SolicitudesController } from './api/solicitudes.controller';
import { SolicitudesTypeOrmRepository } from './infrastructure/consulta.typeorm-repository';
import { ConsultarSolicitudesService } from './services/consultar.service';

@Module({
  imports: [AuthModule],
  controllers: [SolicitudesController],
  providers: [
    SolicitudesTypeOrmRepository,
    {
      provide: ConsultarSolicitudesService,
      inject: [SolicitudesTypeOrmRepository],
      useFactory: (repo: SolicitudesTypeOrmRepository) => new ConsultarSolicitudesService(repo),
    },
  ],
})
export class SolicitudesModule {}
