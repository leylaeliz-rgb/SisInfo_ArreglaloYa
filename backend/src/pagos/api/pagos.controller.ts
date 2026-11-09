import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/api/auth.guard';
import type { SolicitudAutenticada } from '../../auth/api/auth.guard';
import { ConsultarPagosService } from '../services/consultar.service';

@Controller('pagos')
@UseGuards(AuthGuard)
export class PagosController {
  constructor(private readonly consulta: ConsultarPagosService) {}

  @Get('me')
  listar(@Req() solicitud: SolicitudAutenticada) {
    return this.consulta.listar(solicitud.user.sub);
  }
}
