import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CalificacionesController } from './api/calificaciones.controller';
import { CalificacionesTypeOrmRepository } from './infrastructure/consulta.typeorm-repository';
import { ConsultarCalificacionesService } from './services/consultar.service';

import { OperacionesCalificacionesController } from './api/operaciones.controller';
import { OperacionesCalificacionesTypeOrmRepository } from './infrastructure/operaciones.repository';
import { OperacionesCalificacionesService } from './services/operaciones.service';

@Module({
  imports: [AuthModule],
  controllers: [OperacionesCalificacionesController, CalificacionesController],
  providers: [
    OperacionesCalificacionesTypeOrmRepository,
    {
      provide: OperacionesCalificacionesService,
      inject: [OperacionesCalificacionesTypeOrmRepository],
      useFactory: (repo: OperacionesCalificacionesTypeOrmRepository) => new OperacionesCalificacionesService(repo),
    },
    CalificacionesTypeOrmRepository,
    {
      provide: ConsultarCalificacionesService,
      inject: [CalificacionesTypeOrmRepository],
      useFactory: (repo: CalificacionesTypeOrmRepository) => new ConsultarCalificacionesService(repo),
    },
  ],
})
export class CalificacionesModule {}
