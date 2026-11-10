import {
  BadRequestException, Body, Controller, Get, Header, NotFoundException, Param, Post, Req,
  StreamableFile, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../../auth/api/auth.guard';
import type { SolicitudAutenticada } from '../../auth/api/auth.guard';
import { exigirRol, id, opcion, resultado, texto } from '../../shared/api/validacion';
import { DocumentosVerificacionService } from '../services/documentos.service';

@Controller('verificaciones')
@UseGuards(AuthGuard)
export class DocumentosVerificacionController {
  constructor(private readonly documentos: DocumentosVerificacionService) {}

  @Post(':id/documentos')
  @UseInterceptors(FileInterceptor('archivo', { limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 1 } }))
  subir(
    @Req() solicitud: SolicitudAutenticada, @Param('id') recursoId: string, @Body('tipo') tipo: unknown,
    @UploadedFile() archivo: { originalname: string; buffer: Buffer } | undefined,
  ) {
    exigirRol(solicitud.user.rolActivo, 'trabajador');
    if (!archivo?.buffer?.length) throw new BadRequestException('Adjunta un archivo.');
    const bytes = archivo.buffer;
    const mime = bytes.subarray(0, 5).toString('ascii') === '%PDF-' ? 'application/pdf' :
      bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a' ? 'image/png' :
      bytes.subarray(0, 3).toString('hex') === 'ffd8ff' ? 'image/jpeg' : null;
    if (!mime) throw new BadRequestException('Usa PDF, PNG o JPEG.');
    return resultado(this.documentos.guardar(solicitud.user.sub, id(recursoId), {
      tipo: opcion('identidad', 'antecedentes', 'habilidades', 'referencias_reputacion')(tipo),
      nombre: texto(255)(archivo.originalname),
      mime,
      contenido: bytes,
    }));
  }

  @Get('documentos/:id')
  @Header('Cache-Control', 'no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  async descargar(@Req() solicitud: SolicitudAutenticada, @Param('id') documentoId: string) {
    const documento = await this.documentos.leer(id(documentoId), solicitud.user.sub,
      solicitud.user.rolActivo === 'administrador');
    if (!documento) throw new NotFoundException();
    return new StreamableFile(documento.contenido, {
      type: 'application/octet-stream',
      disposition: 'attachment',
    });
  }

  @Get('pendientes')
  pendientes(@Req() solicitud: SolicitudAutenticada) {
    exigirRol(solicitud.user.rolActivo, 'administrador');
    return this.documentos.pendientes();
  }
}
