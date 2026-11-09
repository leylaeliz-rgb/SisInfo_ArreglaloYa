import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/api/auth.guard';
import type { SolicitudAutenticada } from '../../auth/api/auth.guard';
import { ConsultarSolicitudesService } from '../services/consultar.service';

@Controller('solicitudes')
@UseGuards(AuthGuard)
export class SolicitudesController {
  constructor(private readonly consulta: ConsultarSolicitudesService) {}

  @Get('me')
  listar(@Req() solicitud: SolicitudAutenticada) {
    return this.consulta.listar(solicitud.user.sub);
  }
}
