import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '../../auth/api/auth.guard';
import type {
  SolicitudAutenticada,
} from '../../auth/api/auth.guard';

import {
  opcion,
  exigirRol,
} from '../../shared/api/validacion';

import type {
  ConsultaPanel,
} from '../core/panel.repository';

import { PanelService } from '../services/panel.service';

@Controller('panel')
@UseGuards(AuthGuard)
export class PanelController {
  constructor(
    private readonly panel: PanelService,
  ) {}

  @Get(':consulta')
  consultar(
    @Req() solicitud: SolicitudAutenticada,
    @Param('consulta') entrada: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    const consulta = opcion(
      'categorias',
      'zonas',
      'profesionales',
      'resumen',
      'trabajador',
      'servicios',
      'cotizaciones',
      'trabajadores',
      'apelaciones',
      'reclamos',
      'suspensiones',
      'verificaciones',
    )(entrada) as ConsultaPanel;

    if (
      consulta === 'resumen' ||
      consulta === 'profesionales' ||
      consulta === 'categorias' ||
      consulta === 'zonas'
    ) {
      exigirRol(
        solicitud.user.rolActivo,
        'administrador',
      );
    }

    for (const fecha of [desde, hasta]) {
      if (
        fecha !== undefined &&
        (
          !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(fecha) ||
          !Number.isFinite(Date.parse(fecha)) ||
          new Date(fecha).toISOString().slice(0, 10) !== fecha
        )
      ) {
        throw new BadRequestException(
          'Usa fechas válidas con formato AAAA-MM-DD.',
        );
      }
    }

    if (desde && hasta && desde > hasta) {
      throw new BadRequestException(
        'La fecha inicial debe ser anterior a la final.',
      );
    }

    return this.panel.consultar(
      consulta,
      solicitud.user.sub,
      solicitud.user.rolActivo === 'administrador',
      solicitud.user.rolActivo,
      desde,
      hasta,
    );
  }
}