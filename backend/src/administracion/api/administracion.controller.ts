import { Controller, Get, ForbiddenException, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/api/auth.guard';
import type { SolicitudAutenticada } from '../../auth/api/auth.guard';
import { ConsultarAdministracionService } from '../services/consultar.service';

@Controller('administracion')
@UseGuards(AuthGuard)
export class AdministracionController {
  constructor(private readonly consulta: ConsultarAdministracionService) {}

  @Get('suspensiones')
  listar(@Req() solicitud: SolicitudAutenticada) {
    if (!solicitud.user.roles.includes('administrador')) {
      throw new ForbiddenException();
    }

    return this.consulta.listar();
  }
}
