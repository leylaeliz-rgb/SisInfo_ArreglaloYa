import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PagosController } from './api/pagos.controller';
import { PagosTypeOrmRepository } from './infrastructure/consulta.typeorm-repository';
import { ConsultarPagosService } from './services/consultar.service';

import { OperacionesPagoTypeOrmRepository } from './infrastructure/operaciones-pago.repository';
import { RegistrarPagoService } from './services/registrar-pago.service';

@Module({
  imports: [AuthModule],
  controllers: [PagosController],
  providers: [
    PagosTypeOrmRepository,
    OperacionesPagoTypeOrmRepository,
    {
      provide: RegistrarPagoService,
      inject: [OperacionesPagoTypeOrmRepository],
      useFactory: (repo: OperacionesPagoTypeOrmRepository) => new RegistrarPagoService(repo),
    },
    {
      provide: ConsultarPagosService,
      inject: [PagosTypeOrmRepository],
      useFactory: (repo: PagosTypeOrmRepository) => new ConsultarPagosService(repo),
    },
  ],
})
export class PagosModule {}
