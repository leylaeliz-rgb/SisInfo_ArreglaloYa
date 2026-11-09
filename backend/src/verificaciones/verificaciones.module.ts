import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VerificacionesController } from './api/verificaciones.controller';
import { VerificacionesTypeOrmRepository } from './infrastructure/consulta.typeorm-repository';
import { ConsultarVerificacionesService } from './services/consultar.service';

import { OperacionesVerificacionesController } from './api/operaciones.controller';
import { OperacionesVerificacionesTypeOrmRepository } from './infrastructure/operaciones.repository';
import { OperacionesVerificacionesService } from './services/operaciones.service';

@Module({
  imports: [AuthModule],
  controllers: [OperacionesVerificacionesController, VerificacionesController],
  providers: [
    OperacionesVerificacionesTypeOrmRepository,
    {
      provide: OperacionesVerificacionesService,
      inject: [OperacionesVerificacionesTypeOrmRepository],
      useFactory: (repo: OperacionesVerificacionesTypeOrmRepository) => new OperacionesVerificacionesService(repo),
    },
    VerificacionesTypeOrmRepository,
    {
      provide: ConsultarVerificacionesService,
      inject: [VerificacionesTypeOrmRepository],
      useFactory: (repo: VerificacionesTypeOrmRepository) => new ConsultarVerificacionesService(repo),
    },
  ],
})
export class VerificacionesModule {}
