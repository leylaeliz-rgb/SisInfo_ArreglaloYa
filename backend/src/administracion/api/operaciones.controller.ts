import { Controller, Req, UseGuards, Put, Param } from '@nestjs/common';
import { AuthGuard } from '../../auth/api/auth.guard';
import type { SolicitudAutenticada } from '../../auth/api/auth.guard';
import { resultado, exigirRol, id } from '../../shared/api/validacion';
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
}
