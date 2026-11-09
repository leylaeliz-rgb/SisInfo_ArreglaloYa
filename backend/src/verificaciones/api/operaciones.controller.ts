import { Controller, Req, UseGuards, Post, Put, Param, Body } from '@nestjs/common';
import { AuthGuard } from '../../auth/api/auth.guard';
import type { SolicitudAutenticada } from '../../auth/api/auth.guard';
import { resultado, exigirRol, id, opcion, texto } from '../../shared/api/validacion';
import { OperacionesVerificacionesService } from '../services/operaciones.service';

@Controller('verificaciones')
@UseGuards(AuthGuard)
export class OperacionesVerificacionesController {
  constructor(private readonly operaciones: OperacionesVerificacionesService) {}

  @Post()
  solicitar(
    @Req() solicitud: SolicitudAutenticada,
  ) {
    exigirRol(solicitud.user.rolActivo, 'trabajador');
    return resultado(this.operaciones.solicitar(
      solicitud.user.sub,
    ));
  }

  @Put(':id/decision')
  decidir(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') recursoId: string,
    @Body() cuerpo: Record<string, unknown> | undefined,
  ) {
    exigirRol(solicitud.user.rolActivo, 'administrador');
    return resultado(this.operaciones.decidir(
      solicitud.user.sub,
      id(recursoId),
      opcion('aprobada', 'rechazada', 'requiere_informacion')(cuerpo?.estado),
      texto(1000)(cuerpo?.motivo),
    ));
  }
}
