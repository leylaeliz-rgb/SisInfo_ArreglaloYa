import {
  BadRequestException, Controller, Get, Header, NotFoundException, Param, Post, Req,
  StreamableFile, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../../auth/api/auth.guard';
import type { SolicitudAutenticada } from '../../auth/api/auth.guard';
import { id, opcion, texto } from '../../shared/api/validacion';
import { AdjuntoNoPermitido, TipoAdjunto } from '../core/adjuntos.repository';
import { AdjuntosService } from '../services/adjuntos.service';

@Controller('adjuntos')
@UseGuards(AuthGuard)
export class AdjuntosController {
  constructor(private readonly adjuntos: AdjuntosService) {}

  private tipo(entrada: string) {
    return opcion('solicitudes', 'pagos', 'reclamos')(entrada) as TipoAdjunto;
  }

  private async responder<T>(operacion: Promise<T>): Promise<T> {
    try { return await operacion; }
    catch (error) {
      if (error instanceof AdjuntoNoPermitido) {
        throw new BadRequestException('No se permite este adjunto. Revisa los permisos, el estado y el límite de cinco fotos.');
      }
      throw error;
    }
  }

  @Get(':tipo/:id')
  listar(@Req() solicitud: SolicitudAutenticada, @Param('tipo') tipo: string, @Param('id') recurso: string) {
    return this.responder(this.adjuntos.listar(this.tipo(tipo), id(recurso), solicitud.user.sub,
      solicitud.user.rolActivo === 'administrador'));
  }

  @Post(':tipo/:id')
  @UseInterceptors(FileInterceptor('archivo', { limits: { files: 1, fileSize: 2097152 } }))
  subir(
    @Req() solicitud: SolicitudAutenticada, @Param('tipo') tipo: string, @Param('id') recurso: string,
    @UploadedFile() archivo: { originalname: string; buffer: Buffer } | undefined,
  ) {
    if (!archivo?.buffer?.length) throw new BadRequestException('Adjunta un archivo.');
    const bytes = archivo.buffer;
    const mime = bytes.subarray(0, 5).toString('ascii') === '%PDF-' ? 'application/pdf' :
      bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a' ? 'image/png' :
      bytes.subarray(0, 3).toString('hex') === 'ffd8ff' ? 'image/jpeg' : null;
    if (!mime) throw new BadRequestException('Usa PDF, PNG o JPEG.');
    return this.responder(this.adjuntos.guardar(this.tipo(tipo), id(recurso), solicitud.user.sub,
      texto(255)(archivo.originalname), mime, bytes));
  }

  @Get('archivo/:clave/descarga')
  @Header('Cache-Control', 'no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  async descargar(@Req() solicitud: SolicitudAutenticada, @Param('clave') clave: string) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clave)) {
      throw new BadRequestException('Archivo inválido.');
    }
    const archivo = await this.adjuntos.descargar(clave, solicitud.user.sub, solicitud.user.rolActivo === 'administrador');
    if (!archivo) throw new NotFoundException();
    return new StreamableFile(archivo.contenido, {
      type: 'application/octet-stream',
      disposition: "attachment; filename*=UTF-8''" + encodeURIComponent(archivo.nombre),
    });
  }
}
