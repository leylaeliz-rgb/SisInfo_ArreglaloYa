import { DocumentoVerificacion, DocumentosVerificacionRepository } from '../core/documentos.repository';

export class DocumentosVerificacionService {
  constructor(private readonly documentos: DocumentosVerificacionRepository) {}

  guardar(usuarioId: string, solicitudId: string, documento: DocumentoVerificacion) {
    return this.documentos.guardar(usuarioId, solicitudId, documento);
  }

  renovar(usuarioId: string, documentoId: string, documento: Omit<DocumentoVerificacion, 'tipo'>) {
    return this.documentos.renovar(usuarioId, documentoId, documento);
  }

  revisarDocumento(
    adminId: string,
    documentoId: string,
    estado: 'aprobado' | 'rechazado',
    observacion: string,
  ) {
    return this.documentos.revisarDocumento(adminId, documentoId, estado, observacion);
  }

  leer(documentoId: string, usuarioId: string, administrador: boolean) {
    return this.documentos.leer(documentoId, usuarioId, administrador);
  }

  pendientes() {
    return this.documentos.pendientes();
  }
}