import { BadRequestException, Body, ConflictException, Controller, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/api/auth.guard';
import type { SolicitudAutenticada } from '../../auth/api/auth.guard';
import { entero, exigirRol, id } from '../../shared/api/validacion';
import { ConfiguracionTrabajadorService } from '../services/configuracion.service';

@Controller('trabajadores/me')
@UseGuards(AuthGuard)
export class ConfiguracionTrabajadorController {
  constructor(private readonly configuracion: ConfiguracionTrabajadorService) {}

  @Put('especialidades')
  async especialidades(@Req() solicitud: SolicitudAutenticada, @Body('categoriaIds') entrada: unknown) {
    exigirRol(solicitud.user.rolActivo, 'trabajador');
    const categoriaIds = this.listaIds(entrada);
    this.verificar(await this.configuracion.especialidades(solicitud.user.sub, categoriaIds));
    return { categoriaIds };
  }

  @Put('cobertura')
  async cobertura(@Req() solicitud: SolicitudAutenticada, @Body('zonaIds') entrada: unknown) {
    exigirRol(solicitud.user.rolActivo, 'trabajador');
    const zonaIds = this.listaIds(entrada);
    this.verificar(await this.configuracion.cobertura(solicitud.user.sub, zonaIds));
    return { zonaIds };
  }

  @Put('horarios')
  async horarios(@Req() solicitud: SolicitudAutenticada, @Body('franjas') entrada: unknown) {
    exigirRol(solicitud.user.rolActivo, 'trabajador');
    if (!Array.isArray(entrada) || entrada.length > 100) {
      throw new BadRequestException('Envía hasta 100 franjas.');
    }

    const franjas = entrada.map((valor: unknown) => {
      const franja = valor as Record<string, unknown> | null;
      const dia = entero(0, 6)(franja?.dia);
      const { inicio, fin } = franja ?? {};
      const formato = /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/;
      if (typeof inicio !== 'string' || typeof fin !== 'string' ||
          !formato.test(inicio) || !formato.test(fin) || inicio >= fin) {
        throw new BadRequestException('Usa horas HH:mm con inicio anterior a fin.');
      }
      return { dia, inicio, fin };
    }).sort((a, b) => a.dia - b.dia || a.inicio.localeCompare(b.inicio));

    if (franjas.some((actual, i) => i > 0 && franjas[i - 1].dia === actual.dia &&
        franjas[i - 1].fin > actual.inicio)) {
      throw new BadRequestException('Las franjas del mismo día no pueden solaparse.');
    }

    this.verificar(await this.configuracion.horarios(solicitud.user.sub, franjas));
    return { franjas };
  }

  private listaIds(entrada: unknown): string[] {
    if (!Array.isArray(entrada) || entrada.length > 100) {
      throw new BadRequestException('Envía una lista de hasta 100 IDs.');
    }
    return [...new Set(entrada.map(id))];
  }

  private verificar(guardado: boolean) {
    if (!guardado) {
      throw new ConflictException('Crea el perfil primero y comprueba que los IDs estén activos.');
    }
  }
}
