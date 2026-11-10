import { DocumentoVerificacion, DocumentosVerificacionRepository } from '../core/documentos.repository';

export class DocumentosVerificacionService {
  constructor(private readonly documentos: DocumentosVerificacionRepository) {}

  guardar(usuarioId: string, solicitudId: string, documento: DocumentoVerificacion) {
    return this.documentos.guardar(usuarioId, solicitudId, documento);
  }

  leer(documentoId: string, usuarioId: string, administrador: boolean) {
    return this.documentos.leer(documentoId, usuarioId, administrador);
  }

  pendientes() {
    return this.documentos.pendientes();
  }
}
