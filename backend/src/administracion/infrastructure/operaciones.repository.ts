import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OperacionesAdministracionRepository, ResultadoAdministracion } from '../core/operaciones.repository';

@Injectable()
export class OperacionesAdministracionTypeOrmRepository implements OperacionesAdministracionRepository {
  constructor(private readonly db: DataSource) {}

  async revocarSuspension(usuarioId: string, recursoId: string): Promise<ResultadoAdministracion | undefined> {
    const [fila] = await this.db.query(
      `UPDATE suspensiones_trabajador SET estado='revocada' WHERE id=$2 AND $1::bigint IS NOT NULL AND estado IN ('activa','programada') RETURNING id,estado`,
      [usuarioId, recursoId],
    );
    return fila;
  }

  async registrarIncidencia(usuarioId: string, trabajadorId: string, motivo: string): Promise<ResultadoAdministracion | undefined> {
    const [fila] = await this.db.query(
      `INSERT INTO incidencias_disciplinarias (trabajador_id, reportada_por, motivo)
       SELECT usuario_id, $1, $3 FROM perfiles_trabajador WHERE usuario_id=$2
       RETURNING id, estado`,
      [usuarioId, trabajadorId, motivo],
    );
    return fila;
  }

  async listarIncidencias(): Promise<ResultadoAdministracion[]> {
    return await this.db.query(
      `SELECT id, trabajador_id, servicio_id, motivo, estado, reportada_en, revisada_en
       FROM incidencias_disciplinarias ORDER BY id DESC LIMIT 100`,
    );
  }

  async revisarIncidencia(usuarioId: string, incidenciaId: string, estado: string, observaciones: string): Promise<ResultadoAdministracion | undefined> {
    const [fila] = await this.db.query(
      `UPDATE incidencias_disciplinarias SET estado=$3, observaciones=$4, revisada_por=$1, revisada_en=NOW()
       WHERE id=$2 AND estado='pendiente' RETURNING id,estado`,
      [usuarioId, incidenciaId, estado, observaciones],
    );
    return fila;
  }

  async aplicarSuspension(usuarioId: string, incidenciaId: string): Promise<ResultadoAdministracion | undefined> {
    return this.db.transaction(async (tx) => {
      const [incidencia] = await tx.query(
        `SELECT i.trabajador_id,i.motivo FROM incidencias_disciplinarias i
         JOIN perfiles_trabajador p ON p.usuario_id=i.trabajador_id
         WHERE i.id=$1 AND i.estado='confirmada' FOR UPDATE OF p`, [incidenciaId],
      );
      if (!incidencia) return undefined;
      const [previa] = await tx.query(
        `SELECT COALESCE(MAX(numero_reincidencia),0) AS reincidencias
         FROM suspensiones_trabajador WHERE trabajador_id=$1 AND estado<>'revocada'`,
        [incidencia.trabajador_id],
      );
      const numero = previa.reincidencias + 1;
      let dias = 1;
      let siguiente = 2;
      for (let i = 1; i < numero; i++) {
        [dias, siguiente] = [siguiente, dias + siguiente];
        if (dias > 36500) return undefined;
      }

      const [fila] = await tx.query(
        `INSERT INTO suspensiones_trabajador
         (trabajador_id,incidencia_id,numero_reincidencia,duracion_dias,motivo,inicia_en,termina_en,estado,aplicada_por)
         VALUES ($1,$2,$3,$4,$5,NOW(),NOW()+make_interval(days => $4),'activa',$6)
         ON CONFLICT (incidencia_id) DO NOTHING RETURNING id,estado,duracion_dias`,
        [incidencia.trabajador_id, incidenciaId, numero, dias, incidencia.motivo, usuarioId],
      );
      return fila;
    });
  }

  async apelarVerificacion(usuarioId: string, recursoId: string, motivo: string): Promise<ResultadoAdministracion | undefined> {
    const [fila] = await this.db.query(
      `WITH previo AS (SELECT id FROM solicitudes_verificacion WHERE id=$2 AND trabajador_id=$1 AND estado='rechazada' FOR UPDATE)
INSERT INTO apelaciones (solicitante_id,solicitud_verificacion_id,motivo)
SELECT $1,id,$3 FROM previo WHERE NOT EXISTS (SELECT 1 FROM apelaciones WHERE solicitud_verificacion_id=$2) RETURNING id,estado`,
      [usuarioId, recursoId, motivo],
    );
    return fila;
  }

  async apelarSuspension(usuarioId: string, recursoId: string, motivo: string): Promise<ResultadoAdministracion | undefined> {
    const [fila] = await this.db.query(
      `WITH previo AS (SELECT id FROM suspensiones_trabajador WHERE id=$2 AND trabajador_id=$1 AND estado IN ('activa','programada') AND termina_en>NOW() FOR UPDATE)
INSERT INTO apelaciones (solicitante_id,suspension_id,motivo)
SELECT $1,id,$3 FROM previo WHERE NOT EXISTS (SELECT 1 FROM apelaciones WHERE suspension_id=$2) RETURNING id,estado`,
      [usuarioId, recursoId, motivo],
    );
    return fila;
  }

  async resolverApelacion(usuarioId: string, recursoId: string, estado: string, decision: string): Promise<ResultadoAdministracion | undefined> {
    const [fila] = await this.db.query(
      `WITH cambio AS (
 UPDATE apelaciones SET estado=$3,decision=$4,revisada_por=$1,revisada_en=NOW()
 WHERE id=$2 AND estado IN ('presentada','en_revision') RETURNING id,estado,suspension_id,solicitud_verificacion_id
), suspension AS (
 UPDATE suspensiones_trabajador s SET estado='revocada' FROM cambio c WHERE s.id=c.suspension_id AND c.estado='aceptada'
), verificacion AS (
 UPDATE solicitudes_verificacion v SET estado='en_revision',actualizado_en=NOW()
 FROM cambio c WHERE v.id=c.solicitud_verificacion_id AND c.estado='aceptada' AND v.estado='rechazada'
 AND NOT EXISTS (SELECT 1 FROM solicitudes_verificacion x WHERE x.trabajador_id=v.trabajador_id AND x.estado IN ('pendiente','en_revision','requiere_informacion'))
) SELECT id,estado FROM cambio`,
      [usuarioId, recursoId, estado, decision],
    );
    return fila;
  }
}
