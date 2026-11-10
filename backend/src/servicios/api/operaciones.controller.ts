import { Delete, Controller, Req, UseGuards, Post, Put, Param, Body, Get } from '@nestjs/common';
import { AuthGuard } from '../../auth/api/auth.guard';
import type { SolicitudAutenticada } from '../../auth/api/auth.guard';
import { resultado, exigirRol, id, importe, fechaFutura, texto } from '../../shared/api/validacion';
import { OperacionesServiciosService } from '../services/operaciones.service';

@Controller('servicios')
@UseGuards(AuthGuard)
export class OperacionesServiciosController {
  constructor(private readonly operaciones: OperacionesServiciosService) {}

  @Post('cotizaciones/:id')
  contratar(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') recursoId: string,
  ) {
    exigirRol(solicitud.user.rolActivo, 'cliente');
    return resultado(this.operaciones.contratar(
      solicitud.user.sub,
      id(recursoId),
    ));
  }

  @Put(':id/finalizacion')
  finalizar(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') recursoId: string,
  ) {
    exigirRol(solicitud.user.rolActivo, 'trabajador');
    return resultado(this.operaciones.finalizar(
      solicitud.user.sub,
      id(recursoId),
    ));
  }

  @Post(':id/precios')
  proponerPrecio(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') recursoId: string,
    @Body() cuerpo: Record<string, unknown> | undefined,
  ) {
    exigirRol(solicitud.user.rolActivo, 'trabajador');
    return resultado(this.operaciones.proponerPrecio(
      solicitud.user.sub, id(recursoId), importe(cuerpo?.manoObra),
      importe(cuerpo?.materiales), importe(cuerpo?.transporte),
    ));
  }

  @Put(':id/precios/:propuestaId/aceptacion')
  aceptarPrecio(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') recursoId: string,
    @Param('propuestaId') propuestaId: string,
  ) {
    exigirRol(solicitud.user.rolActivo, 'cliente');
    return resultado(this.operaciones.aceptarPrecio(solicitud.user.sub, id(recursoId), id(propuestaId)));
  }

  @Put(':id/inicio')
  iniciar(@Req() solicitud: SolicitudAutenticada, @Param('id') recursoId: string) {
    exigirRol(solicitud.user.rolActivo, 'trabajador');
    return resultado(this.operaciones.iniciar(solicitud.user.sub, id(recursoId)));
  }

  @Delete(':id')
  cancelarAntesDeIniciar(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') recursoId: string,
  ) {
    exigirRol(solicitud.user.rolActivo, 'cliente');
    return resultado(this.operaciones.cancelarAntesDeIniciar(solicitud.user.sub, id(recursoId)));
  }

  @Put(':id/visita')
  agendar(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') recursoId: string,
    @Body() cuerpo: Record<string, unknown> | undefined,
  ) {
    exigirRol(solicitud.user.rolActivo, 'cliente');
    return resultado(this.operaciones.agendar(
      solicitud.user.sub,
      id(recursoId),
      fechaFutura(cuerpo?.fecha),
    ));
  }

  @Get(':id/contacto')
  contacto(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') recursoId: string,
  ) {
    return resultado(this.operaciones.contacto(
      solicitud.user.sub,
      id(recursoId),
    ));
  }

  @Put(':id/precios/:propuestaId/rechazo')
  rechazarPrecio(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') recursoId: string,
    @Param('propuestaId') propuestaId: string,
  ) {
    exigirRol(solicitud.user.rolActivo, 'cliente');
    return resultado(this.operaciones.rechazarPrecio(
      solicitud.user.sub,
      id(recursoId),
      id(propuestaId),
    ));
  }

  @Post(':id/incrementos')
  proponerIncremento(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') recursoId: string,
    @Body() cuerpo: Record<string, unknown> | undefined,
  ) {
    exigirRol(solicitud.user.rolActivo, 'trabajador');
    return resultado(this.operaciones.proponerIncremento(
      solicitud.user.sub,
      id(recursoId),
      importe(cuerpo?.manoObra),
      importe(cuerpo?.materiales),
      texto(2000)(cuerpo?.justificacion),
    ));
  }

  @Put(':id/incrementos/:propuestaId/aceptacion')
  aceptarIncremento(
    @Req() solicitud: SolicitudAutenticada,
    @Param('id') recursoId: string,
    @Param('propuestaId') propuestaId: string,
  ) {
    exigirRol(solicitud.user.rolActivo, 'cliente');
    return resultado(this.operaciones.aceptarIncremento(
      solicitud.user.sub,
      id(recursoId),
      id(propuestaId),
    ));
  }

  @Put(':id/cancelacion-trabajador')
  cancelarPorTrabajador(
    @Req() solicitud: SolicitudAutenticada, @Param('id') recursoId: string, @Body('motivo') motivo: unknown,
  ) {
    exigirRol(solicitud.user.rolActivo, 'trabajador');
    return resultado(this.operaciones.cancelarPorTrabajador(solicitud.user.sub, id(recursoId), texto(1000)(motivo)));
  }
}
