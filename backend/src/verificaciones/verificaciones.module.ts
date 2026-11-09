import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VerificacionesController } from './api/verificaciones.controller';
import { VerificacionesTypeOrmRepository } from './infrastructure/consulta.typeorm-repository';
import { ConsultarVerificacionesService } from './services/consultar.service';

@Module({
  imports: [AuthModule],
  controllers: [VerificacionesController],
  providers: [
    VerificacionesTypeOrmRepository,
    {
      provide: ConsultarVerificacionesService,
      inject: [VerificacionesTypeOrmRepository],
      useFactory: (repo: VerificacionesTypeOrmRepository) => new ConsultarVerificacionesService(repo),
    },
  ],
})
export class VerificacionesModule {}
