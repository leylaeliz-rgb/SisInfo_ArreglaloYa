import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import {
  DatosPerfilTrabajador,
  PerfilesTrabajadorRepository,
  ZonaBaseNoEncontrada,
} from '../core/perfil-trabajador';
import { PerfilTrabajadorOrmEntity } from './perfil-trabajador.orm-entity';

@Injectable()
export class PerfilesTrabajadorTypeOrmRepository implements PerfilesTrabajadorRepository {
  constructor(
    @InjectRepository(PerfilTrabajadorOrmEntity)
    private readonly perfiles: Repository<PerfilTrabajadorOrmEntity>,
  ) {}

  buscar(usuarioId: string) {
    return this.perfiles.findOneBy({ usuarioId });
  }

  async guardar(usuarioId: string, datos: DatosPerfilTrabajador): Promise<void> {
    try {
      await this.perfiles.upsert(
        { usuarioId, zonaBaseId: datos.zonaBaseId, descripcion: datos.descripcion },
        ['usuarioId'],
      );
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const detalle = error.driverError as { code?: string; constraint?: string };
        if (detalle.code === '23503' && detalle.constraint === 'perfiles_trabajador_zona_base_id_fkey') {
          throw new ZonaBaseNoEncontrada('La zona base indicada no existe.');
        }
      }

      throw error;
    }
  }
}
