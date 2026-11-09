export interface Franja {
  dia: number;
  inicio: string;
  fin: string;
}

export interface ConfiguracionTrabajadorRepository {
  especialidades(usuarioId: string, ids: string[]): Promise<boolean>;
  cobertura(usuarioId: string, ids: string[]): Promise<boolean>;
  horarios(usuarioId: string, franjas: Franja[]): Promise<boolean>;
}
