import { Global, Module } from '@nestjs/common';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { UsuariosService } from '../usuarios/services/usuarios.service';
import { AuthController } from './api/auth.controller';
import { AuthGuard } from './api/auth.guard';
import { SeguridadAdapter } from './infrastructure/seguridad.adapter';
import { AuthService } from './services/auth.service';

import { RevocacionesTypeOrmRepository } from './infrastructure/revocaciones.repository';

@Global()
@Module({
  imports: [UsuariosModule],
  controllers: [AuthController],
  providers: [
    SeguridadAdapter,
    RevocacionesTypeOrmRepository,
    {
      provide: AuthService,
      inject: [UsuariosService, SeguridadAdapter, RevocacionesTypeOrmRepository],
      useFactory: (cuentas: UsuariosService, seguridad: SeguridadAdapter, revocaciones: RevocacionesTypeOrmRepository) => new AuthService(cuentas, seguridad, revocaciones),
    },
    AuthGuard,
  ],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
