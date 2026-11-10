export interface DocumentoVerificacion {
  tipo: string;
  nombre: string;
  mime: string;
  contenido: Buffer;
}

export interface DocumentosVerificacionRepository {
  guardar(usuarioId: string, solicitudId: string, documento: DocumentoVerificacion): Promise<{ id: string } | undefined>;
  leer(documentoId: string, usuarioId: string, administrador: boolean): Promise<DocumentoVerificacion | undefined>;

  pendientes(): Promise<Record<string, unknown>[]>;
}
