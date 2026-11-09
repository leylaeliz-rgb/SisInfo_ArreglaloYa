import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ReclamosController } from './api/reclamos.controller';
import { ReclamosTypeOrmRepository } from './infrastructure/consulta.typeorm-repository';
import { ConsultarReclamosService } from './services/consultar.service';

import { OperacionesReclamosController } from './api/operaciones.controller';
import { OperacionesReclamosTypeOrmRepository } from './infrastructure/operaciones.repository';
import { OperacionesReclamosService } from './services/operaciones.service';

@Module({
  imports: [AuthModule],
  controllers: [OperacionesReclamosController, ReclamosController],
  providers: [
    OperacionesReclamosTypeOrmRepository,
    {
      provide: OperacionesReclamosService,
      inject: [OperacionesReclamosTypeOrmRepository],
      useFactory: (repo: OperacionesReclamosTypeOrmRepository) => new OperacionesReclamosService(repo),
    },
    ReclamosTypeOrmRepository,
    {
      provide: ConsultarReclamosService,
      inject: [ReclamosTypeOrmRepository],
      useFactory: (repo: ReclamosTypeOrmRepository) => new ConsultarReclamosService(repo),
    },
  ],
})
export class ReclamosModule {}
