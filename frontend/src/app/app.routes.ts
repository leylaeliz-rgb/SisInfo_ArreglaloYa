// app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, rolGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login').then((m) => m.Login) },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./features/usuarios/perfil').then((m) => m.Perfil),
  },
  {
    path: 'admin',
    canActivate: [authGuard, rolGuard('administrador')],
    loadComponent: () => import('./features/administracion/suspensiones').then((m) => m.Suspensiones),
  },
  { path: '', pathMatch: 'full', redirectTo: 'perfil' },
  { path: '**', redirectTo: 'perfil' },
];