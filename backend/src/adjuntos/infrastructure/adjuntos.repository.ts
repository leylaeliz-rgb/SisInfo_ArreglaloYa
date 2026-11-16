import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource, EntityManager } from 'typeorm';
import { AdjuntoNoPermitido, AdjuntosRepository, ArchivoAdjunto, TipoAdjunto } from '../core/adjuntos.repository';

const config = {
  solicitudes: { tabla: 'fotografias_solicitud', padre: 'solicitud_id', columna: 'fotografia_id' },
  pagos: { tabla: 'comprobantes_pago', padre: 'pago_id', columna: 'comprobante_id' },
  reclamos: { tabla: 'adjuntos_reclamo', padre: 'reclamo_id', columna: 'adjunto_reclamo_id' },
} as const;

@Injectable()
export class AdjuntosTypeOrmRepository implements AdjuntosRepository {
  constructor(private readonly db: DataSource) {}

  private async autorizar(
    tx: EntityManager, tipo: TipoAdjunto, id: string, usuario: string, admin: boolean, escritura: boolean,
  ) {
    let consulta: string;
    if (tipo === 'solicitudes') {
      consulta = escritura ?
        `SELECT id FROM solicitudes_servicio WHERE id=$1 AND cliente_id=$2 AND estado IN ('publicada','recibiendo_ofertas') FOR UPDATE` :
        `SELECT s.id FROM solicitudes_servicio s WHERE s.id=$1 AND ($3::boolean OR s.cliente_id=$2
          OR EXISTS (SELECT 1 FROM servicios v WHERE v.solicitud_id=s.id AND v.trabajador_id=$2)
          OR (s.estado IN ('publicada','recibiendo_ofertas') AND (s.modalidad='publica' OR s.trabajador_destino_id=$2)
             AND EXISTS(SELECT 1 FROM perfiles_trabajador WHERE usuario_id=$2 AND estado_verificacion='aprobado')))`;
    } else if (tipo === 'pagos') {
      consulta = `SELECT p.id FROM pagos p JOIN servicios s ON s.id=p.servicio_id WHERE p.id=$1
        AND (s.cliente_id=$2 OR s.trabajador_id=$2 ${escritura ? '' : 'OR $3::boolean'})
        ${escritura ? "AND s.estado<>'cancelado' FOR UPDATE OF p" : ''}`;
    } else {
      consulta = `SELECT id FROM reclamos WHERE id=$1 AND (cliente_id=$2 ${escritura ? '' : 'OR $3::boolean'})
        ${escritura ? "AND estado IN ('pendiente','en_revision') FOR UPDATE" : ''}`;
    }
    const [fila] = await tx.query(consulta, escritura ? [id, usuario] : [id, usuario, admin]);
    return Boolean(fila);
  }

  async listar(tipo: TipoAdjunto, recursoId: string, usuarioId: string, administrador: boolean) {
    return this.db.transaction(async tx => {
      if (!(await this.autorizar(tx, tipo, recursoId, usuarioId, administrador, false))) {
        throw new AdjuntoNoPermitido();
      }
      const c = config[tipo];
      return tx.query(
        `SELECT almacenamiento_key AS id,nombre_archivo AS nombre FROM ${c.tabla}
         WHERE ${c.padre}=$1 ORDER BY id`, [recursoId],
      );
    });
  }

  guardar(tipo: TipoAdjunto, recursoId: string, usuarioId: string, nombre: string, mime: string, contenido: Buffer): Promise<ArchivoAdjunto> {
    return this.db.transaction(async tx => {
      if (!(await this.autorizar(tx, tipo, recursoId, usuarioId, false, true))) {
        throw new AdjuntoNoPermitido();
      }
      const c = config[tipo];
      if (tipo === 'solicitudes') {
        const [{ total }] = await tx.query('SELECT COUNT(*)::int AS total FROM fotografias_solicitud WHERE solicitud_id=$1', [recursoId]);
        if (total >= 5 || mime === 'application/pdf') throw new AdjuntoNoPermitido();
      }
      const clave = randomUUID();
      let filas;
      if (tipo === 'solicitudes') {
        filas = await tx.query(
          `INSERT INTO fotografias_solicitud (solicitud_id,nombre_archivo,almacenamiento_key,tipo_mime)
           VALUES ($1,$2,$3,$4) RETURNING id`, [recursoId, nombre, clave, mime],
        );
      } else {
        filas = await tx.query(
          `INSERT INTO ${c.tabla} (${c.padre},nombre_archivo,almacenamiento_key,subido_por)
           VALUES ($1,$2,$3,$4) RETURNING id`, [recursoId, nombre, clave, usuarioId],
        );
      }
      await tx.query(
        `INSERT INTO contenido_adjuntos (clave,${c.columna},contenido,tipo_mime) VALUES ($1,$2,$3,$4)`,
        [clave, filas[0].id, contenido, mime],
      );
      return { id: clave, nombre };
    });
  }

  async descargar(clave: string, usuarioId: string, administrador: boolean) {
    return this.db.transaction(async tx => {
      const [archivo] = await tx.query('SELECT * FROM contenido_adjuntos WHERE clave=$1', [clave]);
      if (!archivo) return undefined;
      const tipo: TipoAdjunto = archivo.fotografia_id ? 'solicitudes' : archivo.comprobante_id ? 'pagos' : 'reclamos';
      const c = config[tipo];
      const [meta] = await tx.query(
        `SELECT ${c.padre} AS recurso,nombre_archivo AS nombre FROM ${c.tabla} WHERE id=$1`,
        [archivo[c.columna]],
      );
      if (!meta || !(await this.autorizar(tx, tipo, meta.recurso, usuarioId, administrador, false))) return undefined;
      return { id: clave, nombre: meta.nombre, contenido: archivo.contenido };
    });
  }
}
