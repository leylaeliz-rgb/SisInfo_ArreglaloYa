import { Module } from '@nestjs/common';
import { UsuariosController } from './api/usuarios.controller';
import { CuentasTypeOrmRepository } from './infrastructure/cuentas.repository';
import { UsuariosService } from './services/usuarios.service';

@Module({
  controllers: [UsuariosController],
  providers: [
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
