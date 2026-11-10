import {
  BadRequestException, Body, ConflictException, Controller, ForbiddenException,
  Get, NotFoundException, Param, Put, Req, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../auth/api/auth.guard';
import type { SolicitudAutenticada } from '../../auth/api/auth.guard';
import { AccionPago, PagoNoPermitido, ServicioInaccesible } from '../core/operaciones-pago';
import { ConsultarPagosService } from '../services/consultar.service';
import { RegistrarPagoService } from '../services/registrar-pago.service';

@Controller('pagos')
@UseGuards(AuthGuard)
export class PagosController {
  constructor(
    private readonly consulta: ConsultarPagosService,
    private readonly registro: RegistrarPagoService,
  ) {}

  @Get('me')
  listar(@Req() solicitud: SolicitudAutenticada) {
    return this.consulta.listar(solicitud.user.sub);
  }

  @Put(':servicioId/anticipo')
  anticipo(@Req() solicitud: SolicitudAutenticada, @Param('servicioId') id: string) {
    return this.ejecutar(solicitud, id, { tipo: 'anticipo' });
  }

  @Put(':servicioId/saldo')
  reportarSaldo(
    @Req() solicitud: SolicitudAutenticada,
    @Param('servicioId') id: string,
    @Body('metodo') metodo: unknown,
    @Body('conforme') conforme: unknown,
  ) {
    if (conforme !== true || (metodo !== 'efectivo' && metodo !== 'qr_acordado')) {
      throw new BadRequestException('Confirma la conformidad e indica efectivo o qr_acordado.');
    }
    return this.ejecutar(solicitud, id, { tipo: 'reportar-saldo', metodo });
  }

  @Put(':servicioId/saldo/recepcion')
  confirmarSaldo(@Req() solicitud: SolicitudAutenticada, @Param('servicioId') id: string) {
    return this.ejecutar(solicitud, id, { tipo: 'confirmar-saldo' });
  }

  @Put(':servicioId/anticipo/reversion')
  revertirAnticipo(
    @Req() solicitud: SolicitudAutenticada,
    @Param('servicioId') id: string,
    @Body('motivo') motivo: unknown,
  ) {
    if (typeof motivo !== 'string' || !motivo.trim() || motivo.trim().length > 1000) {
      throw new BadRequestException('Indica el motivo de la reversión.');
    }
    return this.ejecutar(solicitud, id, { tipo: 'revertir-anticipo', motivo: motivo.trim() });
  }

  private async ejecutar(solicitud: SolicitudAutenticada, id: string, accion: AccionPago) {
    if (!/^[1-9][0-9]{0,18}$/.test(id) || BigInt(id) > 9223372036854775807n) {
      throw new BadRequestException('El identificador de servicio es inválido.');
    }

    const rol = accion.tipo === 'revertir-anticipo' ? 'administrador' :
      accion.tipo === 'confirmar-saldo' ? 'trabajador' : 'cliente';
    if (solicitud.user.rolActivo !== rol) {
      throw new ForbiddenException(`Activa el rol ${rol} para realizar esta operación.`);
    }

    try {
      return await this.registro.ejecutar(id, solicitud.user.sub, accion);
    } catch (error) {
      if (error instanceof ServicioInaccesible) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof PagoNoPermitido) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }
}
