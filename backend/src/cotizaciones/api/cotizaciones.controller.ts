import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/api/auth.guard';
import type { SolicitudAutenticada } from '../../auth/api/auth.guard';
import { ConsultarCotizacionesService } from '../services/consultar.service';

@Controller('cotizaciones')
@UseGuards(AuthGuard)
export class CotizacionesController {
  constructor(private readonly consulta: ConsultarCotizacionesService) {}

  @Get('me')
  listar(@Req() solicitud: SolicitudAutenticada) {
    return this.consulta.listar(solicitud.user.sub);
  }
}
