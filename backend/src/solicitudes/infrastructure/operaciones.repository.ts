import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OperacionesSolicitudesRepository, ResultadoSolicitudes } from '../core/operaciones.repository';

@Injectable()
export class OperacionesSolicitudesTypeOrmRepository implements OperacionesSolicitudesRepository {
  constructor(private readonly db: DataSource) {}

  async publicar(usuarioId: string, categoriaId: string, zonaId: string, titulo: string, descripcion: string, urgente: boolean): Promise<ResultadoSolicitudes | undefined> {
    const [fila] = await this.db.query(
      `INSERT INTO solicitudes_servicio (cliente_id,categoria_id,zona_id,modalidad,titulo,descripcion,urgente,recargo_urgencia_pct) SELECT $1,c.id,z.id,'publica',$4,$5,$6,CASE WHEN $6 THEN 10 ELSE 0 END FROM categorias c CROSS JOIN zonas z WHERE c.id=$2 AND c.activa AND z.id=$3 AND z.activa RETURNING id, titulo, estado`,
      [usuarioId, categoriaId, zonaId, titulo, descripcion, urgente],
    );
    return fila;
  }

  async editar(usuarioId: string, recursoId: string, titulo: string, descripcion: string): Promise<ResultadoSolicitudes | undefined> {
    const [fila] = await this.db.query(
      `UPDATE solicitudes_servicio SET titulo=$3, descripcion=$4, actualizada_en=NOW() WHERE cliente_id=$1 AND id=$2 AND estado='publicada' AND NOT EXISTS (SELECT 1 FROM cotizaciones WHERE solicitud_id=$2) RETURNING id,titulo,descripcion,estado`,
      [usuarioId, recursoId, titulo, descripcion],
    );
    return fila;
  }

  async cancelar(usuarioId: string, recursoId: string, motivo: string): Promise<ResultadoSolicitudes | undefined> {
    const [fila] = await this.db.query(
      `UPDATE solicitudes_servicio SET estado='cancelada', cancelada_por=$1, motivo_cancelacion=$3, cancelada_en=NOW(), actualizada_en=NOW() WHERE cliente_id=$1 AND id=$2 AND estado IN ('publicada','recibiendo_ofertas') RETURNING id,estado`,
      [usuarioId, recursoId, motivo],
    );
    return fila;
  }

  async publicarDirecta(usuarioId: string, recursoId: string, categoriaId: string, zonaId: string, titulo: string, descripcion: string, urgente: boolean): Promise<ResultadoSolicitudes | undefined> {
    const [fila] = await this.db.query(
      `INSERT INTO solicitudes_servicio (cliente_id,trabajador_destino_id,categoria_id,zona_id,modalidad,titulo,descripcion,urgente,recargo_urgencia_pct)
SELECT $1,p.usuario_id,c.id,z.id,'directa',$5,$6,$7,CASE WHEN $7 THEN 10 ELSE 0 END
FROM perfiles_trabajador p JOIN trabajador_categorias tc ON tc.trabajador_id=p.usuario_id
JOIN categorias c ON c.id=tc.categoria_id AND c.activa
JOIN trabajador_zonas_cobertura tz ON tz.trabajador_id=p.usuario_id
JOIN zonas z ON z.id=tz.zona_id AND z.activa
WHERE p.usuario_id=$2 AND p.usuario_id<>$1 AND p.estado_verificacion='aprobado' AND p.disponible AND c.id=$3 AND z.id=$4
AND NOT EXISTS (SELECT 1 FROM suspensiones_trabajador WHERE trabajador_id=p.usuario_id AND estado IN ('programada','activa') AND NOW()>=inicia_en AND NOW()<termina_en)
AND NOT EXISTS (SELECT 1 FROM pausas_disponibilidad WHERE trabajador_id=p.usuario_id AND reactivada_en IS NULL)
RETURNING id,estado,titulo`,
      [usuarioId, recursoId, categoriaId, zonaId, titulo, descripcion, urgente],
    );
    return fila;
  }

  async explorar(usuarioId: string): Promise<ResultadoSolicitudes[]> {
    return await this.db.query(
      `SELECT s.id,s.titulo,s.descripcion,s.zona_id,s.categoria_id,s.modalidad,s.urgente,s.prioridad_nivel
FROM solicitudes_servicio s JOIN perfiles_trabajador p ON p.usuario_id=$1 AND p.estado_verificacion='aprobado'
WHERE s.cliente_id<>$1 AND s.estado IN ('publicada','recibiendo_ofertas') AND (s.modalidad='publica' OR s.trabajador_destino_id=$1)
ORDER BY (EXISTS (SELECT 1 FROM trabajador_categorias WHERE trabajador_id=$1 AND categoria_id=s.categoria_id)
AND EXISTS (SELECT 1 FROM trabajador_zonas_cobertura WHERE trabajador_id=$1 AND zona_id=s.zona_id)) DESC,
s.urgente DESC,s.prioridad_nivel DESC,s.id DESC LIMIT 100`,
      [usuarioId],
    );
  }
}
