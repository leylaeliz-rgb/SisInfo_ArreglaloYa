import type { CategoriaAdmin, ZonaAdmin } from './catalogos.repository';

export type TipoZona = 'macrodistrito' | 'zona' | 'otb';

export interface DatosCategoria {
  codigo: string;
  nombre: string;
  descripcion?: string;
}

export interface CambiosCategoria {
  nombre?: string;
  descripcion?: string;
  activa?: boolean;
}

export interface DatosZona {
  nombre: string;
  tipo: TipoZona;
  zonaPadreId?: string;
}

export interface CambiosZona {
  nombre?: string;
  /** undefined = no cambia; null = quitar la zona padre */
  zonaPadreId?: string | null;
  activa?: boolean;
}

export interface OperacionesCatalogosRepository {
  crearCategoria(usuarioId: string, datos: DatosCategoria): Promise<CategoriaAdmin>;
  editarCategoria(usuarioId: string, recursoId: string, cambios: CambiosCategoria): Promise<CategoriaAdmin>;
  crearZona(usuarioId: string, datos: DatosZona): Promise<ZonaAdmin>;
  editarZona(usuarioId: string, recursoId: string, cambios: CambiosZona): Promise<ZonaAdmin>;
}