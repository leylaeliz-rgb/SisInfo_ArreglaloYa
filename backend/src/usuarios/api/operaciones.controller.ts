import { Post, Delete, Controller, Req, UseGuards, Patch, Body } from '@nestjs/common';
import { AuthGuard } from '../../auth/api/auth.guard';
import type { SolicitudAutenticada } from '../../auth/api/auth.guard';
import { resultado, texto } from '../../shared/api/validacion';
import { OperacionesUsuariosService } from '../services/operaciones.service';

@Controller('usuarios/me')
@UseGuards(AuthGuard)
export class OperacionesUsuariosController {
  constructor(private readonly operaciones: OperacionesUsuariosService) {}

  @Patch()
  actualizarPerfil(
    @Req() solicitud: SolicitudAutenticada,
    @Body() cuerpo: Record<string, unknown> | undefined,
  ) {
    return resultado(this.operaciones.actualizarPerfil(
      solicitud.user.sub,
      texto(150)(cuerpo?.nombreCompleto),
    ));
  }

  @Delete()
  desactivar(
    @Req() solicitud: SolicitudAutenticada,
  ) {
    return resultado(this.operaciones.desactivar(solicitud.user.sub));
  }

  @Post('inscripcion-trabajador')
  inscribirseComoTrabajador(@Req() solicitud: SolicitudAutenticada) {
    return resultado(this.operaciones.inscribirseComoTrabajador(solicitud.user.sub));
  }
}
