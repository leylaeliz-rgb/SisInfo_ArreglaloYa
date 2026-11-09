import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrabajadoresController } from './api/trabajadores.controller';
import { PERFILES_TRABAJADOR, PerfilesTrabajadorRepository } from './core/perfil-trabajador';
import { PerfilTrabajadorOrmEntity } from './infrastructure/perfil-trabajador.orm-entity';
import { PerfilesTrabajadorTypeOrmRepository } from './infrastructure/perfiles-trabajador.typeorm-repository';
import { TrabajadoresService } from './services/trabajadores.service';

@Module({
  imports: [TypeOrmModule.forFeature([PerfilTrabajadorOrmEntity])],
  controllers: [TrabajadoresController],
  providers: [
    { provide: PERFILES_TRABAJADOR, useClass: PerfilesTrabajadorTypeOrmRepository },
    {
      provide: TrabajadoresService,
      inject: [PERFILES_TRABAJADOR],
      useFactory: (repositorio: PerfilesTrabajadorRepository) => new TrabajadoresService(repositorio),
    },
  ],
})
export class TrabajadoresModule {}
