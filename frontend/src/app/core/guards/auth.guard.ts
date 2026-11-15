// core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from '../models/auth.models';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.autenticado() ? true : inject(Router).createUrlTree(['/login']);
};

export const rolGuard = (rol: Rol): CanActivateFn => () => {
  const auth = inject(AuthService);
  return auth.rolActivo() === rol ? true : inject(Router).createUrlTree(['/perfil']);
};