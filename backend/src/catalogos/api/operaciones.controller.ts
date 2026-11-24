import { Body, Controller, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/api/auth.guard';
import type { SolicitudAutenticada } from '../../auth/api/auth.guard';
import { booleano, exigirRol, id, opcion, texto } from '../../shared/api/validacion';
import type { TipoZona } from '../core/operaciones.repository';
import { OperacionesCatalogosService } from '../services/operaciones.service';
import { codigoCategoria, opcional, zonaPadre } from './campos';

type Cuerpo = Record<string, unknown> | undefined;

@Controller('catalogos')
@UseGuards(AuthGuard)
export class OperacionesCatalogosController {
  constructor(private readonly operaciones: OperacionesCatalogosService) {}

  @Post('categorias')
  crearCategoria(@Req() solicitud: SolicitudAutenticada, @Body() cuerpo: Cuerpo) {
    exigirRol(solicitud.user.rolActivo, 'administrador');
    return this.operaciones.crearCategoria(solicitud.user.sub, {
      codigo: codigoCategoria(cuerpo?.codigo),
      nombre: texto(100)(cuerpo?.nombre),
      descripcion: opcional(texto(500))(cuerpo?.descripcion),
    });
  }

  @Patch('categorias/:id')
  editarCategoria(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') recursoId: string,
    @Body() cuerpo: Cuerpo,
  ) {
    exigirRol(solicitud.user.rolActivo, 'administrador');
    return this.operaciones.editarCategoria(solicitud.user.sub, id(recursoId), {
      nombre: opcional(texto(100))(cuerpo?.nombre),
      descripcion: opcional(texto(500))(cuerpo?.descripcion),
      activa: opcional(booleano)(cuerpo?.activa),
    });
  }

  @Post('zonas')
  crearZona(@Req() solicitud: SolicitudAutenticada, @Body() cuerpo: Cuerpo) {
    exigirRol(solicitud.user.rolActivo, 'administrador');
    return this.operaciones.crearZona(solicitud.user.sub, {
      nombre: texto(120)(cuerpo?.nombre),
      tipo: opcion('macrodistrito', 'zona', 'otb')(cuerpo?.tipo) as TipoZona,
      zonaPadreId: zonaPadre(cuerpo?.zonaPadreId) ?? undefined,
    });
  }

  @Patch('zonas/:id')
  editarZona(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') recursoId: string,
    @Body() cuerpo: Cuerpo,
  ) {
    exigirRol(solicitud.user.rolActivo, 'administrador');
    return this.operaciones.editarZona(solicitud.user.sub, id(recursoId), {
      nombre: opcional(texto(120))(cuerpo?.nombre),
      zonaPadreId: zonaPadre(cuerpo?.zonaPadreId),
      activa: opcional(booleano)(cuerpo?.activa),
    });
  }
}