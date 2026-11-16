export type TipoAdjunto = 'solicitudes' | 'pagos' | 'reclamos';
export interface ArchivoAdjunto { id: string; nombre: string; }
export interface ContenidoAdjunto extends ArchivoAdjunto { contenido: Buffer; }
export class AdjuntoNoPermitido extends Error {}
export interface AdjuntosRepository {
  listar(tipo: TipoAdjunto, recursoId: string, usuarioId: string, administrador: boolean): Promise<ArchivoAdjunto[]>;
  guardar(tipo: TipoAdjunto, recursoId: string, usuarioId: string, nombre: string, mime: string, contenido: Buffer): Promise<ArchivoAdjunto>;
  descargar(clave: string, usuarioId: string, administrador: boolean): Promise<ContenidoAdjunto | undefined>;
}
