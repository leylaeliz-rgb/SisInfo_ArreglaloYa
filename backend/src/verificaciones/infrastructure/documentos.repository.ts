import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { DocumentoVerificacion, DocumentosVerificacionRepository } from '../core/documentos.repository';

@Injectable()
export class DocumentosVerificacionTypeOrmRepository implements DocumentosVerificacionRepository {
  constructor(private readonly db: DataSource) {}

  async guardar(usuarioId: string, solicitudId: string, documento: DocumentoVerificacion) {
    return this.db.transaction(async (tx) => {
      const [tipoCfg] = await tx.query(
        'SELECT obligatorio FROM tipos_documento_verificacion WHERE tipo=$1',
        [documento.tipo],
      );
      if (tipoCfg?.obligatorio && !documento.fechaVencimiento) {
        throw new BadRequestException('Este documento es obligatorio y requiere fecha de vencimiento.');
      }

      const [fila] = await tx.query(
        `WITH solicitud AS (
           SELECT id FROM solicitudes_verificacion WHERE id=$2 AND trabajador_id=$1
           AND estado IN ('pendiente','requiere_informacion') FOR UPDATE
         ), nuevo AS (
           INSERT INTO documentos_verificacion
           (solicitud_verificacion_id,tipo_documento,nombre_archivo,almacenamiento_key,tipo_mime,tamano_bytes,fecha_vencimiento,estado_vigencia)
           SELECT id,$3,$4,$5,$6,$7,$9::date,'vigente' FROM solicitud RETURNING id,solicitud_verificacion_id
         ), contenido AS (
           INSERT INTO archivos_verificacion (documento_id,contenido) SELECT id,$8 FROM nuevo
         ), anteriores AS (
           UPDATE documentos_verificacion d
           SET estado_vigencia='reemplazado', reemplazado_por_id=n.id
           FROM nuevo n
           WHERE d.solicitud_verificacion_id=n.solicitud_verificacion_id
             AND d.tipo_documento=$3
             AND d.id<>n.id
             AND d.estado_vigencia<>'reemplazado'
         ), reinicio AS (
           UPDATE revisiones_verificacion r SET resultado='pendiente',revisado_por=NULL,revisado_en=NULL
           FROM solicitud s WHERE r.solicitud_verificacion_id=s.id AND EXISTS (SELECT 1 FROM nuevo)
           AND r.criterio=CASE WHEN $3::varchar='referencias_reputacion' THEN 'reputacion' ELSE $3::varchar END
         ) SELECT id FROM nuevo`,
        [usuarioId, solicitudId, documento.tipo, documento.nombre, randomUUID(),
          documento.mime, documento.contenido.length, documento.contenido, documento.fechaVencimiento ?? null],
      );
      return fila;
    });
  }

  async renovar(usuarioId: string, documentoId: string, documento: Omit<DocumentoVerificacion, 'tipo'>) {
    return this.db.transaction(async (tx) => {
      const [previo] = await tx.query(
        `SELECT d.id, d.solicitud_verificacion_id, d.tipo_documento, t.obligatorio
         FROM documentos_verificacion d
         JOIN solicitudes_verificacion v ON v.id = d.solicitud_verificacion_id
         LEFT JOIN tipos_documento_verificacion t ON t.tipo = d.tipo_documento
         WHERE d.id = $1 AND v.trabajador_id = $2 AND d.estado_vigencia <> 'reemplazado'
         FOR UPDATE OF d`,
        [documentoId, usuarioId],
      );
      if (!previo) return undefined;
      if (previo.obligatorio && !documento.fechaVencimiento) {
        throw new BadRequestException('Indica la nueva fecha de vencimiento del documento obligatorio.');
      }

      const [nuevo] = await tx.query(
        `INSERT INTO documentos_verificacion
         (solicitud_verificacion_id,tipo_documento,nombre_archivo,almacenamiento_key,tipo_mime,tamano_bytes,fecha_vencimiento,estado_vigencia)
         VALUES ($1,$2,$3,$4,$5,$6,$7::date,'vigente')
         RETURNING id`,
        [previo.solicitud_verificacion_id, previo.tipo_documento, documento.nombre, randomUUID(),
          documento.mime, documento.contenido.length, documento.fechaVencimiento ?? null],
      );

      await tx.query(
        'INSERT INTO archivos_verificacion (documento_id,contenido) VALUES ($1,$2)',
        [nuevo.id, documento.contenido],
      );

      await tx.query(
        `UPDATE documentos_verificacion
         SET estado_vigencia='reemplazado', reemplazado_por_id=$2
         WHERE id=$1`,
        [previo.id, nuevo.id],
      );

      await tx.query(
        'UPDATE alertas_documentos SET leida=TRUE WHERE documento_id=$1',
        [previo.id],
      );

      return { id: nuevo.id };
    });
  }

  async revisarDocumento(
    adminId: string,
    documentoId: string,
    estado: 'aprobado' | 'rechazado',
    observacion: string,
  ) {
    const [fila] = await this.db.query(
      `UPDATE documentos_verificacion
       SET estado_revision=$3, observacion_revision=$4, revisado_por=$1, revisado_en=NOW()
       WHERE id=$2 AND estado_vigencia<>'reemplazado'
         AND ($3 <> 'aprobado' OR fecha_vencimiento IS NULL OR fecha_vencimiento >= CURRENT_DATE)
       RETURNING id, estado_revision`,
      [adminId, documentoId, estado, observacion],
    );
    return fila;
  }

  async leer(documentoId: string, usuarioId: string, administrador: boolean) {
    const [fila] = await this.db.query(
      `SELECT d.tipo_documento AS tipo,d.nombre_archivo AS nombre,d.tipo_mime AS mime,a.contenido
       FROM documentos_verificacion d JOIN archivos_verificacion a ON a.documento_id=d.id
       JOIN solicitudes_verificacion v ON v.id=d.solicitud_verificacion_id
       WHERE d.id=$1 AND ($3::boolean OR v.trabajador_id=$2)`,
      [documentoId, usuarioId, administrador],
    );
    return fila;
  }

  pendientes(): Promise<Record<string, unknown>[]> {
    return this.db.query(
      `SELECT v.id AS solicitud_id,v.trabajador_id,v.estado,
         COALESCE(json_agg(json_build_object('id',d.id::text,'tipo',d.tipo_documento,
           'nombre',d.nombre_archivo,'fechaVencimiento',to_char(d.fecha_vencimiento,'YYYY-MM-DD'),
           'estadoVigencia',d.estado_vigencia,'estadoRevision',d.estado_revision) ORDER BY d.id) FILTER (WHERE d.id IS NOT NULL),'[]') AS documentos
       FROM solicitudes_verificacion v LEFT JOIN documentos_verificacion d
         ON d.solicitud_verificacion_id=v.id
       WHERE v.estado IN ('pendiente','en_revision','requiere_informacion')
       GROUP BY v.id ORDER BY v.enviada_en,v.id LIMIT 100`,
    );
  }
}