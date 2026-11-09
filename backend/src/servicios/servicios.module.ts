import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ServiciosController } from './api/servicios.controller';
import { ServiciosTypeOrmRepository } from './infrastructure/consulta.typeorm-repository';
import { ConsultarServiciosService } from './services/consultar.service';

@Module({
  imports: [AuthModule],
  controllers: [ServiciosController],
  providers: [
    ServiciosTypeOrmRepository,
    {
      provide: ConsultarServiciosService,
      inject: [ServiciosTypeOrmRepository],
      useFactory: (repo: ServiciosTypeOrmRepository) => new ConsultarServiciosService(repo),
    },
  ],
})
export class ServiciosModule {}
