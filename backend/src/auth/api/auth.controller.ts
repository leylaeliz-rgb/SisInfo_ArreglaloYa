import { BadRequestException, Body, ConflictException, Controller, ForbiddenException, HttpCode, Patch, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { TelefonoDuplicado } from '../../usuarios/core/cuenta';
import { CredencialesInvalidas, PasswordActualIncorrecta, RolNoAsignado } from '../core/seguridad';
import { AuthService } from '../services/auth.service';
import { AuthGuard } from './auth.guard';
import type { SolicitudAutenticada } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async registrar(@Body() cuerpo: Record<string, unknown> | undefined) {
    const { telefono, password } = this.credenciales(cuerpo);
    const nombre = cuerpo?.nombreCompleto;
    const rol = cuerpo?.rol ?? 'cliente';
    if (typeof nombre !== 'string' || !nombre.trim() || nombre.trim().length > 150 ||
        password.length < 8 || (rol !== 'cliente' && rol !== 'trabajador')) {
      throw new BadRequestException('Revisa el nombre, la contraseña y el rol de registro.');
    }

    try {
      return await this.auth.registrar(nombre.trim(), telefono, password, rol);
    } catch (error) {
      if (error instanceof TelefonoDuplicado) throw new ConflictException('El teléfono ya está registrado.');
      throw error;
    }
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() cuerpo: Record<string, unknown> | undefined) {
    const { telefono, password } = this.credenciales(cuerpo);
    try {
      return await this.auth.login(telefono, password);
    } catch (error) {
      if (error instanceof CredencialesInvalidas) throw new UnauthorizedException('Credenciales inválidas.');
      throw error;
    }
  }

  @Post('reactivar')
  @HttpCode(200)
  async reactivar(@Body() cuerpo: Record<string, unknown> | undefined) {
    const { telefono, password } = this.credenciales(cuerpo);
    try {
      return await this.auth.reactivar(telefono, password);
    } catch (error) {
      if (error instanceof CredencialesInvalidas) throw new UnauthorizedException('Credenciales inválidas.');
      throw error;
    }
  }

  @Patch('password')
  @UseGuards(AuthGuard)
  @HttpCode(204)
  async cambiarPassword(
    @Req() solicitud: SolicitudAutenticada,
    @Body() cuerpo: Record<string, unknown> | undefined,
  ) {
    const { passwordActual, passwordNueva } = cuerpo ?? {};
    if (typeof passwordActual !== 'string' || !passwordActual || passwordActual.length > 128 ||
        typeof passwordNueva !== 'string' || passwordNueva.length < 8 || passwordNueva.length > 128) {
      throw new BadRequestException('Revisa la contraseña actual y la nueva (mínimo 8 caracteres).');
    }
    if (passwordNueva === passwordActual) {
      throw new BadRequestException('La contraseña nueva debe ser distinta de la actual.');
    }
    try {
    await this.auth.cambiarPassword(solicitud.user.sub, passwordActual, passwordNueva);
    await this.auth.cerrarSesion(solicitud.user);
  } catch (error) {
    if (error instanceof PasswordActualIncorrecta) {
      throw new BadRequestException('La contraseña actual es incorrecta.');
    }
    throw error;
  }
  }

  @Patch('active-role')
  @UseGuards(AuthGuard)
  cambiarRol(@Req() solicitud: SolicitudAutenticada, @Body('rol') rol: unknown) {
    if (typeof rol !== 'string') throw new BadRequestException('Indica el rol solicitado.');
    try {
      return this.auth.cambiarRol(solicitud.user, rol);
    } catch (error) {
      if (error instanceof RolNoAsignado) throw new ForbiddenException('La cuenta no tiene ese rol.');
      throw error;
    }
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(204)
  async cerrarSesion(@Req() solicitud: SolicitudAutenticada) {
    await this.auth.cerrarSesion(solicitud.user);
  }

  private credenciales(cuerpo: Record<string, unknown> | undefined) {
  const { telefono, password } = cuerpo ?? {};
  if (typeof telefono !== 'string' || !/^\+?[0-9]{7,19}$/.test(telefono.trim()) ||
      typeof password !== 'string' || !password || password.length > 128) {
    throw new BadRequestException('Revisa el teléfono y la contraseña.');
  }
  const limpio = telefono.trim();
  const normalizado = /^\+591[67][0-9]{7}$/.test(limpio) ? limpio.slice(4) : limpio;
  return { telefono: normalizado, password };
}
}
