import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/api/auth.guard';
import type { SolicitudAutenticada } from '../../auth/api/auth.guard';
import { ConsultarReclamosService } from '../services/consultar.service';

@Controller('reclamos')
@UseGuards(AuthGuard)
export class ReclamosController {
  constructor(private readonly consulta: ConsultarReclamosService) {}

  @Get('me')
  listar(@Req() solicitud: SolicitudAutenticada) {
    return this.consulta.listar(solicitud.user.sub);
  }
}
