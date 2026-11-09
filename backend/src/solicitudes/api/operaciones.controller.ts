import { Controller, Req, UseGuards, Post, Patch, Put, Param, Body } from '@nestjs/common';
import { AuthGuard } from '../../auth/api/auth.guard';
import type { SolicitudAutenticada } from '../../auth/api/auth.guard';
import { resultado, exigirRol, id, texto, booleano } from '../../shared/api/validacion';
import { OperacionesSolicitudesService } from '../services/operaciones.service';

@Controller('solicitudes')
@UseGuards(AuthGuard)
export class OperacionesSolicitudesController {
  constructor(private readonly operaciones: OperacionesSolicitudesService) {}

  @Post()
  publicar(
    @Req() solicitud: SolicitudAutenticada,
    @Body() cuerpo: Record<string, unknown> | undefined,
  ) {
    exigirRol(solicitud.user.rolActivo, 'cliente');
    return resultado(this.operaciones.publicar(
      solicitud.user.sub,
      id(cuerpo?.categoriaId),
      id(cuerpo?.zonaId),
      texto(150)(cuerpo?.titulo),
      texto(4000)(cuerpo?.descripcion),
      booleano(cuerpo?.urgente),
    ));
  }

  @Patch(':id')
  editar(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') recursoId: string,
    @Body() cuerpo: Record<string, unknown> | undefined,
  ) {
    exigirRol(solicitud.user.rolActivo, 'cliente');
    return resultado(this.operaciones.editar(
      solicitud.user.sub,
      id(recursoId),
      texto(150)(cuerpo?.titulo),
      texto(4000)(cuerpo?.descripcion),
    ));
  }

  @Put(':id/cancelacion')
  cancelar(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') recursoId: string,
    @Body() cuerpo: Record<string, unknown> | undefined,
  ) {
    exigirRol(solicitud.user.rolActivo, 'cliente');
    return resultado(this.operaciones.cancelar(
      solicitud.user.sub,
      id(recursoId),
      texto(1000)(cuerpo?.motivo),
    ));
  }
}
