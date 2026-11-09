import { Controller, Req, UseGuards, Put, Param, Body } from '@nestjs/common';
import { AuthGuard } from '../../auth/api/auth.guard';
import type { SolicitudAutenticada } from '../../auth/api/auth.guard';
import { resultado, exigirRol, id, entero, texto } from '../../shared/api/validacion';
import { OperacionesCalificacionesService } from '../services/operaciones.service';

@Controller('calificaciones')
@UseGuards(AuthGuard)
export class OperacionesCalificacionesController {
  constructor(private readonly operaciones: OperacionesCalificacionesService) {}

  @Put(':id')
  guardar(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') recursoId: string,
    @Body() cuerpo: Record<string, unknown> | undefined,
  ) {
    exigirRol(solicitud.user.rolActivo, 'cliente');
    return resultado(this.operaciones.guardar(
      solicitud.user.sub,
      id(recursoId),
      entero(1, 5)(cuerpo?.estrellas),
      texto(2000)(cuerpo?.comentario),
    ));
  }
}
