import { Controller, Req, UseGuards, Put, Body } from '@nestjs/common';
import { AuthGuard } from '../../auth/api/auth.guard';
import type { SolicitudAutenticada } from '../../auth/api/auth.guard';
import { resultado, exigirRol, booleano } from '../../shared/api/validacion';
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
}
