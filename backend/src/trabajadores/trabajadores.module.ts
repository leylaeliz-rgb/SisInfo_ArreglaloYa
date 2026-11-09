import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrabajadoresController } from './api/trabajadores.controller';
import { PERFILES_TRABAJADOR, PerfilesTrabajadorRepository } from './core/perfil-trabajador';
import { PerfilTrabajadorOrmEntity } from './infrastructure/perfil-trabajador.orm-entity';
import { PerfilesTrabajadorTypeOrmRepository } from './infrastructure/perfiles-trabajador.typeorm-repository';
import { TrabajadoresService } from './services/trabajadores.service';

import { OperacionesTrabajadoresController } from './api/operaciones.controller';
import { OperacionesTrabajadoresTypeOrmRepository } from './infrastructure/operaciones.repository';
import { OperacionesTrabajadoresService } from './services/operaciones.service';

import { ConfiguracionTrabajadorController } from './api/configuracion.controller';
import { ConfiguracionTrabajadorTypeOrmRepository } from './infrastructure/configuracion.repository';
import { ConfiguracionTrabajadorService } from './services/configuracion.service';

@Module({
  imports: [TypeOrmModule.forFeature([PerfilTrabajadorOrmEntity])],
  controllers: [ConfiguracionTrabajadorController, OperacionesTrabajadoresController, TrabajadoresController],
  providers: [
    ConfiguracionTrabajadorTypeOrmRepository,
    {
      provide: ConfiguracionTrabajadorService,
      inject: [ConfiguracionTrabajadorTypeOrmRepository],
      useFactory: (repo: ConfiguracionTrabajadorTypeOrmRepository) => new ConfiguracionTrabajadorService(repo),
    },
    OperacionesTrabajadoresTypeOrmRepository,
    {
      provide: OperacionesTrabajadoresService,
      inject: [OperacionesTrabajadoresTypeOrmRepository],
      useFactory: (repo: OperacionesTrabajadoresTypeOrmRepository) => new OperacionesTrabajadoresService(repo),
    },
    { provide: PERFILES_TRABAJADOR, useClass: PerfilesTrabajadorTypeOrmRepository },
    {
      provide: TrabajadoresService,
      inject: [PERFILES_TRABAJADOR],
      useFactory: (repositorio: PerfilesTrabajadorRepository) => new TrabajadoresService(repositorio),
    },
  ],
})
export class TrabajadoresModule {}
