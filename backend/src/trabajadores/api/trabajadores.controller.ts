import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { GuardarPerfilTrabajadorDto } from './dto/guardar-perfil-trabajador.dto';
import { TrabajadoresService } from '../services/trabajadores.service';

import { PerfilTrabajadorNoEncontrado, ZonaBaseNoEncontrada } from '../core/perfil-trabajador';

type SolicitudAutenticada = {
  user?: { sub: string; roles: string[] };
};

import { AuthGuard } from '../../auth/api/auth.guard';

@Controller('trabajadores/me')
@UseGuards(AuthGuard)
export class TrabajadoresController {
  constructor(private readonly trabajadores: TrabajadoresService) {}

  @Get()
  consultarPerfil(@Req() solicitud: SolicitudAutenticada) {
    return this.responder(this.trabajadores.consultarPerfil(this.obtenerUsuarioId(solicitud)));
  }

  @Put('perfil')
  guardarPerfil(@Req() solicitud: SolicitudAutenticada, @Body() cuerpo: unknown) {
    const usuarioId = this.obtenerUsuarioId(solicitud);
    return this.responder(this.trabajadores.guardarPerfil(
      usuarioId,
      GuardarPerfilTrabajadorDto.validar(cuerpo),
    ));
  }

  private async responder<T>(operacion: Promise<T>): Promise<T> {
    try {
      return await operacion;
    } catch (error) {
      if (error instanceof PerfilTrabajadorNoEncontrado) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof ZonaBaseNoEncontrada) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  // El guard de autenticación del proyecto debe asignar user desde el JWT validado.
  private obtenerUsuarioId({ user }: SolicitudAutenticada): string {
    if (!user || typeof user.sub !== 'string' || !/^[1-9][0-9]{0,18}$/.test(user.sub)) {
      throw new UnauthorizedException();
    }

    if (!Array.isArray(user.roles) || !user.roles.includes('trabajador')) {
      throw new ForbiddenException('Se requiere el rol trabajador.');
    }

    return user.sub;
  }
}
