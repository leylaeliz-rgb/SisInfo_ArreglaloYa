import { Delete, Controller, Req, UseGuards, Put, Param, Body, Get } from '@nestjs/common';
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

  @Delete(':id')
  retirar(@Req() solicitud: SolicitudAutenticada, @Param('id') recursoId: string) {
    exigirRol(solicitud.user.rolActivo, 'cliente');
    return resultado(this.operaciones.retirar(solicitud.user.sub, id(recursoId)));
  }

  @Get('trabajadores/:id')
  reputacion(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') recursoId: string,
  ) {
    return resultado(this.operaciones.reputacion(
      solicitud.user.sub,
      id(recursoId),
    ));
  }

  @Put('servicios/:id/evaluacion-interna')
  evaluarCliente(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') recursoId: string,
    @Body() cuerpo: Record<string, unknown> | undefined,
  ) {
    exigirRol(solicitud.user.rolActivo, 'trabajador');
    return resultado(this.operaciones.evaluarCliente(
      solicitud.user.sub,
      id(recursoId),
      entero(1, 5)(cuerpo?.valoracion),
      texto(2000)(cuerpo?.descripcion),
    ));
  }

  @Get('clientes/:id/evaluaciones-internas')
  referenciasCliente(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') recursoId: string,
  ) {
    exigirRol(solicitud.user.rolActivo, 'trabajador');
    return this.operaciones.referenciasCliente(
      solicitud.user.sub,
      id(recursoId),
    );
  }
}
