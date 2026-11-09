import { Controller, Req, UseGuards, Post, Patch, Param, Body } from '@nestjs/common';
import { AuthGuard } from '../../auth/api/auth.guard';
import type { SolicitudAutenticada } from '../../auth/api/auth.guard';
import { resultado, exigirRol, texto, id, booleano, opcion } from '../../shared/api/validacion';
import { OperacionesCatalogosService } from '../services/operaciones.service';

@Controller('catalogos')
@UseGuards(AuthGuard)
export class OperacionesCatalogosController {
  constructor(private readonly operaciones: OperacionesCatalogosService) {}

  @Post('categorias')
  crearCategoria(
    @Req() solicitud: SolicitudAutenticada,
    @Body() cuerpo: Record<string, unknown> | undefined,
  ) {
    exigirRol(solicitud.user.rolActivo, 'administrador');
    return resultado(this.operaciones.crearCategoria(
      solicitud.user.sub,
      texto(40)(cuerpo?.codigo),
      texto(100)(cuerpo?.nombre),
    ));
  }

  @Patch('categorias/:id')
  editarCategoria(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') recursoId: string,
    @Body() cuerpo: Record<string, unknown> | undefined,
  ) {
    exigirRol(solicitud.user.rolActivo, 'administrador');
    return resultado(this.operaciones.editarCategoria(
      solicitud.user.sub,
      id(recursoId),
      texto(100)(cuerpo?.nombre),
      booleano(cuerpo?.activa),
    ));
  }

  @Post('zonas')
  crearZona(
    @Req() solicitud: SolicitudAutenticada,
    @Body() cuerpo: Record<string, unknown> | undefined,
  ) {
    exigirRol(solicitud.user.rolActivo, 'administrador');
    return resultado(this.operaciones.crearZona(
      solicitud.user.sub,
      texto(120)(cuerpo?.nombre),
      opcion('zona', 'otb', 'macrodistrito')(cuerpo?.tipo),
    ));
  }

  @Patch('zonas/:id')
  editarZona(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') recursoId: string,
    @Body() cuerpo: Record<string, unknown> | undefined,
  ) {
    exigirRol(solicitud.user.rolActivo, 'administrador');
    return resultado(this.operaciones.editarZona(
      solicitud.user.sub,
      id(recursoId),
      texto(120)(cuerpo?.nombre),
      booleano(cuerpo?.activa),
    ));
  }
}
