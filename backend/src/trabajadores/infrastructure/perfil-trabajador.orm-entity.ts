import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('perfiles_trabajador')
export class PerfilTrabajadorOrmEntity {
  @PrimaryColumn({ name: 'usuario_id', type: 'bigint' })
  usuarioId: string;

  @Column({ name: 'zona_base_id', type: 'bigint' })
  zonaBaseId: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ name: 'estado_verificacion', type: 'varchar', length: 20, default: 'pendiente' })
  estadoVerificacion: string;

  @Column({ type: 'boolean', default: false })
  disponible: boolean;

  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamptz' })
  actualizadoEn: Date;
}
