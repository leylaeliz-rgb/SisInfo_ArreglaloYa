// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, invitadoGuard, rolGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/auth/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/auth/registro').then((m) => m.Registro),
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./features/usuarios/perfil').then((m) => m.Perfil),
  },
  {
    path: 'catalogo',
    loadComponent: () => import('./features/catalogo/catalogo').then((m) => m.Catalogo),
  },
  {
    path: 'calificaciones',
    canActivate: [authGuard],
    loadComponent: () => import('./features/calificaciones/calificaciones').then((m) => m.Calificaciones),
  },
  {
    path: 'espacio',
    redirectTo: 'solicitudes',
    pathMatch: 'full',
  },
  {
    path: 'admin/sanciones',
    canActivate: [authGuard, rolGuard('administrador')],
    loadComponent: () => import('./features/administracion/suspensiones').then((m) => m.Suspensiones),
  },
  {
    path: 'profesional',
    canActivate: [authGuard, rolGuard('trabajador')],
    loadComponent: () => import('./features/profesional/profesional').then(m => m.PerfilProfesional),
  },
  {
    path: 'solicitudes',
    canActivate: [authGuard],
    loadComponent: () => import('./features/solicitudes/solicitudes').then(m => m.SolicitudesPage),
  },
  {
    path: 'servicios',
    canActivate: [authGuard],
    loadComponent: () => import('./features/trabajos/trabajos').then(m => m.TrabajosPage),
  },
  {
    path: 'gestion',
    canActivate: [authGuard],
    loadComponent: () => import('./features/gestion/gestion').then(m => m.GestionPage),
  },
  {
    path: 'admin',
    canActivate: [authGuard, rolGuard('administrador')],
    loadComponent: () => import('./features/gestion/resumen').then(m => m.ResumenAdmin),
  },
  { path: '', pathMatch: 'full', redirectTo: 'catalogo' },
  { path: '**', redirectTo: 'catalogo' },
];
