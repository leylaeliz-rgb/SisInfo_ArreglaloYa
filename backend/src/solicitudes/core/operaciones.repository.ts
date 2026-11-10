export interface ResultadoSolicitudes {
  id?: string;
  [campo: string]: unknown;
}

export interface OperacionesSolicitudesRepository {
  publicar(usuarioId: string, categoriaId: string, zonaId: string, titulo: string, descripcion: string, urgente: boolean): Promise<ResultadoSolicitudes | undefined>;
  editar(usuarioId: string, recursoId: string, titulo: string, descripcion: string): Promise<ResultadoSolicitudes | undefined>;
  cancelar(usuarioId: string, recursoId: string, motivo: string): Promise<ResultadoSolicitudes | undefined>;

  publicarDirecta(usuarioId: string, recursoId: string, categoriaId: string, zonaId: string, titulo: string, descripcion: string, urgente: boolean): Promise<ResultadoSolicitudes | undefined>;

  explorar(usuarioId: string): Promise<ResultadoSolicitudes[]>;
}
