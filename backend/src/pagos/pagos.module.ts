import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PagosController } from './api/pagos.controller';
import { PagosTypeOrmRepository } from './infrastructure/consulta.typeorm-repository';
import { ConsultarPagosService } from './services/consultar.service';

@Module({
  imports: [AuthModule],
  controllers: [PagosController],
  providers: [
    PagosTypeOrmRepository,
    {
      provide: ConsultarPagosService,
      inject: [PagosTypeOrmRepository],
      useFactory: (repo: PagosTypeOrmRepository) => new ConsultarPagosService(repo),
    },
  ],
})
export class PagosModule {}
