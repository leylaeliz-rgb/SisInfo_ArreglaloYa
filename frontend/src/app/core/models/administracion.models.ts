
export interface Suspension {
  id: string;
  trabajador_id: string;
  motivo: string;
  estado: string;
  inicia_en: string;
  termina_en: string;
}

export interface Incidencia {
  id: string;
  trabajador_id: string;
  servicio_id: string | null;
  motivo: string;
  estado: string;
  reportada_en: string;
  revisada_en: string | null;
}