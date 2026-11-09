import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/api/auth.guard';
import type { SolicitudAutenticada } from '../../auth/api/auth.guard';
import { ConsultarCalificacionesService } from '../services/consultar.service';

@Controller('calificaciones')
@UseGuards(AuthGuard)
export class CalificacionesController {
  constructor(private readonly consulta: ConsultarCalificacionesService) {}

  @Get('me')
  listar(@Req() solicitud: SolicitudAutenticada) {
    return this.consulta.listar(solicitud.user.sub);
  }
}
