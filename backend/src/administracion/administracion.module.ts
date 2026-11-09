import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdministracionController } from './api/administracion.controller';
import { AdministracionTypeOrmRepository } from './infrastructure/consulta.typeorm-repository';
import { ConsultarAdministracionService } from './services/consultar.service';

import { OperacionesAdministracionController } from './api/operaciones.controller';
import { OperacionesAdministracionTypeOrmRepository } from './infrastructure/operaciones.repository';
import { OperacionesAdministracionService } from './services/operaciones.service';

@Module({
  imports: [AuthModule],
  controllers: [OperacionesAdministracionController, AdministracionController],
  providers: [
    OperacionesAdministracionTypeOrmRepository,
    {
      provide: OperacionesAdministracionService,
      inject: [OperacionesAdministracionTypeOrmRepository],
      useFactory: (repo: OperacionesAdministracionTypeOrmRepository) => new OperacionesAdministracionService(repo),
    },
    AdministracionTypeOrmRepository,
    {
      provide: ConsultarAdministracionService,
      inject: [AdministracionTypeOrmRepository],
      useFactory: (repo: AdministracionTypeOrmRepository) => new ConsultarAdministracionService(repo),
    },
  ],
})
export class AdministracionModule {}
