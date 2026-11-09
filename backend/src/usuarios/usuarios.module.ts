import { Module } from '@nestjs/common';
import { UsuariosController } from './api/usuarios.controller';
import { CuentasTypeOrmRepository } from './infrastructure/cuentas.repository';
import { UsuariosService } from './services/usuarios.service';

import { OperacionesUsuariosController } from './api/operaciones.controller';
import { OperacionesUsuariosTypeOrmRepository } from './infrastructure/operaciones.repository';
import { OperacionesUsuariosService } from './services/operaciones.service';

@Module({
  controllers: [OperacionesUsuariosController, UsuariosController],
  providers: [
    OperacionesUsuariosTypeOrmRepository,
    {
      provide: OperacionesUsuariosService,
      inject: [OperacionesUsuariosTypeOrmRepository],
      useFactory: (repo: OperacionesUsuariosTypeOrmRepository) => new OperacionesUsuariosService(repo),
    },
    CuentasTypeOrmRepository,
    {
      provide: UsuariosService,
      inject: [CuentasTypeOrmRepository],
      useFactory: (repo: CuentasTypeOrmRepository) => new UsuariosService(repo),
    },
  ],
  exports: [UsuariosService],
})
export class UsuariosModule {}
