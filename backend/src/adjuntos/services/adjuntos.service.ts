import { AdjuntosRepository, TipoAdjunto } from '../core/adjuntos.repository';

export class AdjuntosService {
  constructor(private readonly archivos: AdjuntosRepository) {}
  listar(tipo: TipoAdjunto, recurso: string, usuario: string, admin: boolean) {
    return this.archivos.listar(tipo, recurso, usuario, admin);
  }
  guardar(tipo: TipoAdjunto, recurso: string, usuario: string, nombre: string, mime: string, contenido: Buffer) {
    return this.archivos.guardar(tipo, recurso, usuario, nombre, mime, contenido);
  }
  descargar(clave: string, usuario: string, admin: boolean) {
    return this.archivos.descargar(clave, usuario, admin);
  }
}
