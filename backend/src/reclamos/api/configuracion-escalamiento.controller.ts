
import {
  Body,
  Controller,
  Get,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '../../auth/api/auth.guard';

import type {
  SolicitudAutenticada,
} from '../../auth/api/auth.guard';

import {
  resultado,
  exigirRol,
  entero,
} from '../../shared/api/validacion';

import {
  ConfiguracionEscalamientoService,
} from '../services/configuracion-escalamiento.service';

@Controller('reclamos')
@UseGuards(AuthGuard)
export class ConfiguracionEscalamientoController {

  constructor(
    private readonly configuracion:
      ConfiguracionEscalamientoService
  ) {}

  @Get('configuracion-escalamiento')
  obtener(
    @Req() solicitud: SolicitudAutenticada
  ) {

    exigirRol(
      solicitud.user.rolActivo,
      'administrador'
    );

    return resultado(
      this.configuracion.obtener()
    );
  }

  @Put('configuracion-escalamiento')
  actualizar(
    @Req() solicitud: SolicitudAutenticada,

    @Body() cuerpo:
      Record<string, unknown> | undefined
  ) {

    exigirRol(
      solicitud.user.rolActivo,
      'administrador'
    );

    const plazoHoras = entero(1, 720)(
      cuerpo?.plazoAtencionHoras
    );

    return resultado(
      this.configuracion.actualizar(
        solicitud.user.sub,
        plazoHoras
      )
    );
  }

}
