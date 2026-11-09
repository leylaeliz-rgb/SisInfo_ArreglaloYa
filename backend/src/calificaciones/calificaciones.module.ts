import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CalificacionesController } from './api/calificaciones.controller';
import { CalificacionesTypeOrmRepository } from './infrastructure/consulta.typeorm-repository';
import { ConsultarCalificacionesService } from './services/consultar.service';

@Module({
  imports: [AuthModule],
  controllers: [CalificacionesController],
  providers: [
    CalificacionesTypeOrmRepository,
    {
      provide: ConsultarCalificacionesService,
      inject: [CalificacionesTypeOrmRepository],
      useFactory: (repo: CalificacionesTypeOrmRepository) => new ConsultarCalificacionesService(repo),
    },
  ],
})
export class CalificacionesModule {}
