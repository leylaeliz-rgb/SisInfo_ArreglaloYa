import { Global, Module } from '@nestjs/common';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { UsuariosService } from '../usuarios/services/usuarios.service';
import { AuthController } from './api/auth.controller';
import { AuthGuard } from './api/auth.guard';
import { SeguridadAdapter } from './infrastructure/seguridad.adapter';
import { AuthService } from './services/auth.service';

@Global()
@Module({
  imports: [UsuariosModule],
  controllers: [AuthController],
  providers: [
    SeguridadAdapter,
    {
      provide: AuthService,
      inject: [UsuariosService, SeguridadAdapter],
      useFactory: (cuentas: UsuariosService, seguridad: SeguridadAdapter) => new AuthService(cuentas, seguridad),
    },
    AuthGuard,
  ],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
