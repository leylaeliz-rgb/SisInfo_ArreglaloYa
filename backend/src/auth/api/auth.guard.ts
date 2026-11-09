import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { CredencialesInvalidas, Identidad } from '../core/seguridad';
import { AuthService } from '../services/auth.service';

export interface SolicitudAutenticada {
  user: Identidad;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<SolicitudAutenticada & {
      headers: { authorization?: string };
    }>();
    const token = /^Bearer ([^ ]+)$/i.exec(request.headers.authorization ?? '')?.[1];
    if (!token) throw new UnauthorizedException();

    try {
      request.user = await this.auth.autenticar(token);
      return true;
    } catch (error) {
      if (error instanceof CredencialesInvalidas) throw new UnauthorizedException();
      throw error;
    }
  }
}
