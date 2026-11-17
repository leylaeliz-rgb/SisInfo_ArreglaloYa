import { Post, Delete, Controller, Req, UseGuards, Patch, Body, Get, ConflictException, Ip } from '@nestjs/common';
import { AuthGuard } from '../../auth/api/auth.guard';
import type { SolicitudAutenticada } from '../../auth/api/auth.guard';
import { resultado, texto } from '../../shared/api/validacion';
import { ServiciosAbiertos } from '../core/operaciones.repository';
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
  async desactivar(
    @Req() solicitud: SolicitudAutenticada,
  ) {
    try {
      return await resultado(this.operaciones.desactivar(solicitud.user.sub));
    } catch (error) {
      if (error instanceof ServiciosAbiertos) {
        throw new ConflictException(
          'Tienes servicios abiertos. Finalízalos o cancélalos antes de desactivar tu cuenta.',
        );
      }
      throw error;
    }
  }

  @Post('inscripcion-trabajador')
  inscribirseComoTrabajador(@Req() solicitud: SolicitudAutenticada) {
    return resultado(this.operaciones.inscribirseComoTrabajador(solicitud.user.sub));
  }

    @Post('terminos')
  aceptarTerminos(
    @Req() solicitud: SolicitudAutenticada,
    @Body() cuerpo: Record<string, unknown> | undefined,
    @Ip() ip: string,
  ) {
    return resultado(this.operaciones.aceptarTerminos(
      solicitud.user.sub,
      texto(30)(cuerpo?.version),
      ip || null,
    ));
  }

  @Get('terminos')
  terminosAceptados(@Req() solicitud: SolicitudAutenticada) {
    return this.operaciones.terminosAceptados(solicitud.user.sub);
  }
}
