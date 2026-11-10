import { Delete, Controller, Req, UseGuards, Post, Put, Param, Body } from '@nestjs/common';
import { AuthGuard } from '../../auth/api/auth.guard';
import type { SolicitudAutenticada } from '../../auth/api/auth.guard';
import { resultado, exigirRol, id, texto, opcion } from '../../shared/api/validacion';
import { OperacionesReclamosService } from '../services/operaciones.service';

@Controller('reclamos')
@UseGuards(AuthGuard)
export class OperacionesReclamosController {
  constructor(private readonly operaciones: OperacionesReclamosService) {}

  @Post('servicios/:id')
  presentar(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') recursoId: string,
    @Body() cuerpo: Record<string, unknown> | undefined,
  ) {
    exigirRol(solicitud.user.rolActivo, 'cliente');
    return resultado(this.operaciones.presentar(
      solicitud.user.sub,
      id(recursoId),
      texto(4000)(cuerpo?.descripcion),
      opcion('tecnico', 'financiero', 'otro')(cuerpo?.tipo),
    ));
  }

  @Put(':id/resolucion')
  resolver(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') recursoId: string,
    @Body() cuerpo: Record<string, unknown> | undefined,
  ) {
    exigirRol(solicitud.user.rolActivo, 'administrador');
    return resultado(this.operaciones.resolver(
      solicitud.user.sub,
      id(recursoId),
      opcion('resuelto', 'rechazado')(cuerpo?.estado),
      texto(4000)(cuerpo?.resultado),
    ));
  }

  @Delete(':id')
  retirar(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') recursoId: string,
  ) {
    exigirRol(solicitud.user.rolActivo, 'cliente');
    return resultado(this.operaciones.retirar(solicitud.user.sub, id(recursoId)));
  }
}
