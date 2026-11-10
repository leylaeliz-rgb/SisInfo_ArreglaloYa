import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { DocumentoVerificacion, DocumentosVerificacionRepository } from '../core/documentos.repository';

@Injectable()
export class DocumentosVerificacionTypeOrmRepository implements DocumentosVerificacionRepository {
  constructor(private readonly db: DataSource) {}

  async guardar(usuarioId: string, solicitudId: string, documento: DocumentoVerificacion) {
    const [fila] = await this.db.query(
      `WITH solicitud AS (
         SELECT id FROM solicitudes_verificacion WHERE id=$2 AND trabajador_id=$1
         AND estado IN ('pendiente','requiere_informacion') FOR UPDATE
       ), nuevo AS (
         INSERT INTO documentos_verificacion
         (solicitud_verificacion_id,tipo_documento,nombre_archivo,almacenamiento_key,tipo_mime,tamano_bytes)
         SELECT id,$3,$4,$5,$6,$7 FROM solicitud RETURNING id
       ), contenido AS (
         INSERT INTO archivos_verificacion (documento_id,contenido) SELECT id,$8 FROM nuevo
       ), reinicio AS (
         UPDATE revisiones_verificacion r SET resultado='pendiente',revisado_por=NULL,revisado_en=NULL
         FROM solicitud s WHERE r.solicitud_verificacion_id=s.id AND EXISTS (SELECT 1 FROM nuevo)
         AND r.criterio=CASE WHEN $3::varchar='referencias_reputacion' THEN 'reputacion' ELSE $3::varchar END
       ) SELECT id FROM nuevo`,
      [usuarioId, solicitudId, documento.tipo, documento.nombre, randomUUID(),
        documento.mime, documento.contenido.length, documento.contenido],
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
           'nombre',d.nombre_archivo) ORDER BY d.id) FILTER (WHERE d.id IS NOT NULL),'[]') AS documentos
       FROM solicitudes_verificacion v LEFT JOIN documentos_verificacion d
         ON d.solicitud_verificacion_id=v.id
       WHERE v.estado IN ('pendiente','en_revision','requiere_informacion')
       GROUP BY v.id ORDER BY v.enviada_en,v.id LIMIT 100`,
    );
  }
}
