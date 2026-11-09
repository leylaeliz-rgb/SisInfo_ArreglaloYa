import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/api/auth.guard';
import type { SolicitudAutenticada } from '../../auth/api/auth.guard';
import { ConsultarVerificacionesService } from '../services/consultar.service';

@Controller('verificaciones')
@UseGuards(AuthGuard)
export class VerificacionesController {
  constructor(private readonly consulta: ConsultarVerificacionesService) {}

  @Get('me')
  listar(@Req() solicitud: SolicitudAutenticada) {
    return this.consulta.listar(solicitud.user.sub);
  }
}
