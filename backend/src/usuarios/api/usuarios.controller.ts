import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/api/auth.guard';
import type { SolicitudAutenticada } from '../../auth/api/auth.guard';
import { UsuariosService } from '../services/usuarios.service';

@Controller('usuarios/me')
@UseGuards(AuthGuard)
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  consultar(@Req() solicitud: SolicitudAutenticada) {
    return this.usuarios.buscar(solicitud.user.sub);
  }

  @Get('roles')
  roles(@Req() solicitud: SolicitudAutenticada) {
    return solicitud.user.roles;
  }
}
