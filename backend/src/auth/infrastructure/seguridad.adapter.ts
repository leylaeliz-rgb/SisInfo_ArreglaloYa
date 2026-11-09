import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { sign, verify } from 'jsonwebtoken';
import { Seguridad } from '../core/seguridad';

const derivar = promisify(scrypt);
const opciones = { issuer: 'arreglalo-ya', audience: 'arreglalo-ya-api' };

@Injectable()
export class SeguridadAdapter implements Seguridad {
  constructor(private readonly config: ConfigService) {}

  async hash(password: string) {
    const sal = randomBytes(16).toString('hex');
    const clave = await derivar(password, sal, 64) as Buffer;
    return `scrypt:${sal}:${clave.toString('hex')}`;
  }

  async comprobar(password: string, hash: string) {
    const partes = /^scrypt:([a-f0-9]{32}):([a-f0-9]{128})$/.exec(hash);
    if (!partes) return false;
    const clave = await derivar(password, partes[1], 64) as Buffer;
    return timingSafeEqual(clave, Buffer.from(partes[2], 'hex'));
  }

  emitir(sub: string, rolActivo: string) {
    return sign({ rolActivo }, this.secreto(), {
      ...opciones, subject: sub, algorithm: 'HS256', expiresIn: '15m',
    });
  }

  verificar(token: string) {
    const secreto = this.secreto();
    try {
      const datos = verify(token, secreto, { ...opciones, algorithms: ['HS256'] });
      if (typeof datos === 'string' || typeof datos.sub !== 'string' || typeof datos.rolActivo !== 'string') {
        return null;
      }
      return { sub: datos.sub, rolActivo: datos.rolActivo };
    } catch {
      return null;
    }
  }

  private secreto() {
    const clave = this.config.get<string>('JWT_SECRET');
    if (!clave || Buffer.byteLength(clave) < 32) {
      throw new ServiceUnavailableException('Configura JWT_SECRET con al menos 32 bytes.');
    }
    return clave;
  }
}
