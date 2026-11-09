import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ReclamosController } from './api/reclamos.controller';
import { ReclamosTypeOrmRepository } from './infrastructure/consulta.typeorm-repository';
import { ConsultarReclamosService } from './services/consultar.service';

@Module({
  imports: [AuthModule],
  controllers: [ReclamosController],
  providers: [
    ReclamosTypeOrmRepository,
    {
      provide: ConsultarReclamosService,
      inject: [ReclamosTypeOrmRepository],
      useFactory: (repo: ReclamosTypeOrmRepository) => new ConsultarReclamosService(repo),
    },
  ],
})
export class ReclamosModule {}
