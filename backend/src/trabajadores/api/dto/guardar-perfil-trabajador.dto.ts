import { BadRequestException } from '@nestjs/common';

export class GuardarPerfilTrabajadorDto {
  constructor(
    readonly zonaBaseId: string,
    readonly descripcion: string | null,
  ) {}

  static validar(datos: unknown): GuardarPerfilTrabajadorDto {
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
      throw new BadRequestException('El perfil debe ser un objeto.');
    }

    const { zonaBaseId, descripcion = null } = datos as Record<string, unknown>;
    if (
      typeof zonaBaseId !== 'string' ||
      !/^[1-9][0-9]{0,18}$/.test(zonaBaseId) ||
      BigInt(zonaBaseId) > 9223372036854775807n
    ) {
      throw new BadRequestException('zonaBaseId debe ser un ID válido en formato de texto.');
    }

    if (descripcion !== null && typeof descripcion !== 'string') {
      throw new BadRequestException('descripcion debe ser texto o null.');
    }

    return new GuardarPerfilTrabajadorDto(zonaBaseId, descripcion);
  }
}
