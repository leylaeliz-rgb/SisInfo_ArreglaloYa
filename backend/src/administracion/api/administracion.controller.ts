import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/api/auth.guard';
import type { SolicitudAutenticada } from '../../auth/api/auth.guard';
import { exigirRol } from '../../shared/api/validacion';
import { ConsultarAdministracionService } from '../services/consultar.service';

@Controller('administracion')
@UseGuards(AuthGuard)
export class AdministracionController {
  constructor(private readonly consulta: ConsultarAdministracionService) {}

  @Get('suspensiones')
  listar(@Req() solicitud: SolicitudAutenticada) {
    exigirRol(solicitud.user.rolActivo, 'administrador');
    return this.consulta.listar();
  }
}
