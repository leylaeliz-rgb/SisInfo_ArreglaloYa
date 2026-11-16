export type ConsultaPanel = 'categorias' | 'zonas' | 'profesionales' | 'resumen' | 'trabajador' | 'servicios' | 'cotizaciones' | 'trabajadores' | 'apelaciones' | 'reclamos' | 'suspensiones' | 'verificaciones';
export interface PanelRepository {
  consultar(consulta: ConsultaPanel, usuarioId: string, administrador: boolean, rol: string, desde?: string, hasta?: string): Promise<Record<string, unknown>[]>;
}
