import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/api/auth.guard';
import type { SolicitudAutenticada } from '../../auth/api/auth.guard';
import { ConsultarServiciosService } from '../services/consultar.service';

@Controller('servicios')
@UseGuards(AuthGuard)
export class ServiciosController {
  constructor(private readonly consulta: ConsultarServiciosService) {}

  @Get('me')
  listar(@Req() solicitud: SolicitudAutenticada) {
    return this.consulta.listar(solicitud.user.sub);
  }
}
