import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdministracionController } from './api/administracion.controller';
import { AdministracionTypeOrmRepository } from './infrastructure/consulta.typeorm-repository';
import { ConsultarAdministracionService } from './services/consultar.service';

@Module({
  imports: [AuthModule],
  controllers: [AdministracionController],
  providers: [
    AdministracionTypeOrmRepository,
    {
      provide: ConsultarAdministracionService,
      inject: [AdministracionTypeOrmRepository],
      useFactory: (repo: AdministracionTypeOrmRepository) => new ConsultarAdministracionService(repo),
    },
  ],
})
export class AdministracionModule {}
