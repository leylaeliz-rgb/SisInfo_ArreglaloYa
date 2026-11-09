import { Controller, Req, UseGuards, Post, Put, Param, Body } from '@nestjs/common';
import { AuthGuard } from '../../auth/api/auth.guard';
import type { SolicitudAutenticada } from '../../auth/api/auth.guard';
import { resultado, exigirRol, id, importe, booleano } from '../../shared/api/validacion';
import { OperacionesCotizacionesService } from '../services/operaciones.service';

@Controller('cotizaciones')
@UseGuards(AuthGuard)
export class OperacionesCotizacionesController {
  constructor(private readonly operaciones: OperacionesCotizacionesService) {}

  @Post('solicitudes/:id')
  enviar(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') recursoId: string,
    @Body() cuerpo: Record<string, unknown> | undefined,
  ) {
    exigirRol(solicitud.user.rolActivo, 'trabajador');
    return resultado(this.operaciones.enviar(
      solicitud.user.sub,
      id(recursoId),
      importe(cuerpo?.manoObra),
      importe(cuerpo?.materiales),
      importe(cuerpo?.transporte),
      booleano(cuerpo?.requiereVisita),
    ));
  }

  @Put(':id/retiro')
  retirar(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') recursoId: string,
  ) {
    exigirRol(solicitud.user.rolActivo, 'trabajador');
    return resultado(this.operaciones.retirar(
      solicitud.user.sub,
      id(recursoId),
    ));
  }
}
