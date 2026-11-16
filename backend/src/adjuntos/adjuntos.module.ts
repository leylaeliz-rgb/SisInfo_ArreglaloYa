import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdjuntosController } from './api/adjuntos.controller';
import { AdjuntosTypeOrmRepository } from './infrastructure/adjuntos.repository';
import { AdjuntosService } from './services/adjuntos.service';

@Module({
  imports: [AuthModule],
  controllers: [AdjuntosController],
  providers: [
    AdjuntosTypeOrmRepository,
    { provide: AdjuntosService, inject: [AdjuntosTypeOrmRepository],
      useFactory: (repo: AdjuntosTypeOrmRepository) => new AdjuntosService(repo) },
  ],
})
export class AdjuntosModule {}
