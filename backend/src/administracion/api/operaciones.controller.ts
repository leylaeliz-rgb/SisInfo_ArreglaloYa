import { Get, Patch, Controller, Req, UseGuards, Put, Param, Post, Body } from '@nestjs/common';
import { AuthGuard } from '../../auth/api/auth.guard';
import type { SolicitudAutenticada } from '../../auth/api/auth.guard';
import { resultado, exigirRol, id, texto, opcion } from '../../shared/api/validacion';
import { OperacionesAdministracionService } from '../services/operaciones.service';

@Controller('administracion')
@UseGuards(AuthGuard)
export class OperacionesAdministracionController {
  constructor(private readonly operaciones: OperacionesAdministracionService) {}

  @Put('suspensiones/:id/revocacion')
  revocarSuspension(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') recursoId: string,
  ) {
    exigirRol(solicitud.user.rolActivo, 'administrador');
    return resultado(this.operaciones.revocarSuspension(
      solicitud.user.sub,
      id(recursoId),
    ));
  }

  @Post('incidencias')
  registrarIncidencia(
    @Req() solicitud: SolicitudAutenticada,
    @Body('trabajadorId') trabajador: unknown,
    @Body('motivo') motivo: unknown,
  ) {
    exigirRol(solicitud.user.rolActivo, 'administrador');
    return resultado(this.operaciones.registrarIncidencia(
      solicitud.user.sub, id(trabajador), texto(2000)(motivo),
    ));
  }

  @Get('incidencias')
  listarIncidencias(@Req() solicitud: SolicitudAutenticada) {
    exigirRol(solicitud.user.rolActivo, 'administrador');
    return this.operaciones.listarIncidencias();
  }

  @Patch('incidencias/:id')
  revisarIncidencia(
    @Req() solicitud: SolicitudAutenticada, @Param('id') recursoId: string,
    @Body('estado') estado: unknown, @Body('observaciones') observaciones: unknown,
  ) {
    exigirRol(solicitud.user.rolActivo, 'administrador');
    return resultado(this.operaciones.revisarIncidencia(solicitud.user.sub, id(recursoId),
      opcion('confirmada', 'descartada')(estado), texto(2000)(observaciones)));
  }

  @Post('incidencias/:id/suspension')
  aplicarSuspension(@Req() solicitud: SolicitudAutenticada, @Param('id') recursoId: string) {
    exigirRol(solicitud.user.rolActivo, 'administrador');
    return resultado(this.operaciones.aplicarSuspension(solicitud.user.sub, id(recursoId)));
  }

  @Post('verificaciones/:id/apelaciones')
  apelarVerificacion(@Req() solicitud: SolicitudAutenticada, @Param('id') recursoId: string, @Body() cuerpo: Record<string, unknown> | undefined) {
    exigirRol(solicitud.user.rolActivo, 'trabajador');
    return resultado(this.operaciones.apelarVerificacion(solicitud.user.sub, id(recursoId), texto(2000)(cuerpo?.motivo)));
  }

  @Post('suspensiones/:id/apelaciones')
  apelarSuspension(@Req() solicitud: SolicitudAutenticada, @Param('id') recursoId: string, @Body() cuerpo: Record<string, unknown> | undefined) {
    exigirRol(solicitud.user.rolActivo, 'trabajador');
    return resultado(this.operaciones.apelarSuspension(solicitud.user.sub, id(recursoId), texto(2000)(cuerpo?.motivo)));
  }

  @Put('apelaciones/:id')
  resolverApelacion(@Req() solicitud: SolicitudAutenticada, @Param('id') recursoId: string, @Body() cuerpo: Record<string, unknown> | undefined) {
    exigirRol(solicitud.user.rolActivo, 'administrador');
    return resultado(this.operaciones.resolverApelacion(solicitud.user.sub, id(recursoId), opcion('aceptada', 'rechazada')(cuerpo?.estado), texto(2000)(cuerpo?.decision)));
  }
}
