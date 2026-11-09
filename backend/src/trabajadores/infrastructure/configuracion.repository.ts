import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ConfiguracionTrabajadorRepository, Franja } from '../core/configuracion.repository';

@Injectable()
export class ConfiguracionTrabajadorTypeOrmRepository implements ConfiguracionTrabajadorRepository {
  constructor(private readonly db: DataSource) {}

  especialidades(usuarioId: string, ids: string[]) {
    return this.reemplazar(usuarioId, ids, 'categorias', 'trabajador_categorias', 'categoria_id');
  }

  cobertura(usuarioId: string, ids: string[]) {
    return this.reemplazar(usuarioId, ids, 'zonas', 'trabajador_zonas_cobertura', 'zona_id');
  }

  horarios(usuarioId: string, franjas: Franja[]) {
    return this.conPerfil(usuarioId, async (tx) => {
      await tx.query('DELETE FROM horarios_trabajador WHERE trabajador_id=$1', [usuarioId]);
      await tx.query(
        `INSERT INTO horarios_trabajador (trabajador_id,dia_semana,hora_inicio,hora_fin)
         SELECT $1,dia,inicio,fin FROM jsonb_to_recordset($2::jsonb) AS f(dia smallint,inicio time,fin time)`,
        [usuarioId, JSON.stringify(franjas)],
      );
      return true;
    });
  }

  private reemplazar(
    usuarioId: string, ids: string[], catalogo: 'categorias' | 'zonas',
    tabla: 'trabajador_categorias' | 'trabajador_zonas_cobertura', columna: 'categoria_id' | 'zona_id',
  ) {
    return this.conPerfil(usuarioId, async (tx) => {
      const activos = await tx.query(
        `SELECT id FROM ${catalogo} WHERE id=ANY($1::bigint[]) AND activa FOR SHARE`, [ids],
      );
      if (activos.length !== ids.length) return false;
      await tx.query(`DELETE FROM ${tabla} WHERE trabajador_id=$1`, [usuarioId]);
      await tx.query(
        `INSERT INTO ${tabla} (trabajador_id,${columna}) SELECT $1,unnest($2::bigint[])`, [usuarioId, ids],
      );
      return true;
    });
  }

  private conPerfil(usuarioId: string, operar: (tx: EntityManager) => Promise<boolean>) {
    return this.db.transaction(async (tx) => {
      const [perfil] = await tx.query(
        'SELECT usuario_id FROM perfiles_trabajador WHERE usuario_id=$1 FOR UPDATE', [usuarioId],
      );
      return perfil ? operar(tx) : false;
    });
  }
}
