import { Post, Delete, Controller, Req, UseGuards, Put, Body, Get } from '@nestjs/common';
import { AuthGuard } from '../../auth/api/auth.guard';
import type { SolicitudAutenticada } from '../../auth/api/auth.guard';
import { resultado, exigirRol, booleano, entero } from '../../shared/api/validacion';
import { OperacionesTrabajadoresService } from '../services/operaciones.service';

@Controller('trabajadores/me')
@UseGuards(AuthGuard)
export class OperacionesTrabajadoresController {
  constructor(private readonly operaciones: OperacionesTrabajadoresService) {}

  @Put('disponibilidad')
  cambiarDisponibilidad(
    @Req() solicitud: SolicitudAutenticada,
    @Body() cuerpo: Record<string, unknown> | undefined,
  ) {
    exigirRol(solicitud.user.rolActivo, 'trabajador');
    return resultado(this.operaciones.cambiarDisponibilidad(
      solicitud.user.sub,
      booleano(cuerpo?.disponible),
    ));
  }

  @Delete('perfil')
  retirarPerfil(
    @Req() solicitud: SolicitudAutenticada,
  ) {
    exigirRol(solicitud.user.rolActivo, 'trabajador');
    return resultado(this.operaciones.retirarPerfil(solicitud.user.sub));
  }

  @Get('buscar')
  buscar(
    @Req() solicitud: SolicitudAutenticada,
  ) {
    return this.operaciones.buscar(
      solicitud.user.sub,
    );
  }

  @Post('pausas')
  pausar(@Req() solicitud: SolicitudAutenticada, @Body() cuerpo: Record<string, unknown> | undefined) {
    exigirRol(solicitud.user.rolActivo, 'trabajador');
    return resultado(this.operaciones.pausar(solicitud.user.sub, entero(1, 30)(cuerpo?.dias)));
  }

  @Put('pausas/reactivacion')
  reactivar(@Req() solicitud: SolicitudAutenticada) {
    exigirRol(solicitud.user.rolActivo, 'trabajador');
    return resultado(this.operaciones.reactivar(solicitud.user.sub));
  }
}
