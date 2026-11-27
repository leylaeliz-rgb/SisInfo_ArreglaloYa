export interface DocumentoVerificacion {
  tipo: string;
  nombre: string;
  mime: string;
  contenido: Buffer;
  fechaVencimiento?: string | null;
}

export interface DocumentosVerificacionRepository {
  guardar(usuarioId: string, solicitudId: string, documento: DocumentoVerificacion): Promise<{ id: string } | undefined>;
  renovar(
    usuarioId: string,
    documentoId: string,
    documento: Omit<DocumentoVerificacion, 'tipo'>,
  ): Promise<{ id: string } | undefined>;
  revisarDocumento(
    adminId: string,
    documentoId: string,
    estado: 'aprobado' | 'rechazado',
    observacion: string,
  ): Promise<{ id: string; estado_revision: string } | undefined>;
  leer(documentoId: string, usuarioId: string, administrador: boolean): Promise<DocumentoVerificacion | undefined>;

  pendientes(): Promise<Record<string, unknown>[]>;
}
