import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth-guard';
import { roleGuard, adminGuard, participantGuard } from './guards/role.guard';

/**
 * Configuration des routes de l'application
 * Utilise les guards pour protéger les routes et gérer les redirections basées sur les rôles
 */
export const routes: Routes = [
  /**
   * Route par défaut: redirige vers /home
   * Le roleGuard sur /home s'occupera de rediriger selon le rôle
   */
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },

  /**
   * Route de login
   * Protégée par guestGuard: les utilisateurs connectés sont redirigés vers /home
   */
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.page').then(m => m.LoginPage),
    canActivate: [guestGuard]
  },

  /**
   * Route d'inscription
   * Protégée par guestGuard: les utilisateurs connectés sont redirigés vers /home
   */
  {
    path: 'register',
    loadComponent: () => import('./pages/auth/register/register.page').then(m => m.RegisterPage),
    canActivate: [guestGuard]
  },

  /**
   * Route /home: point d'entrée après connexion
   * Protégée par authGuard (vérifier authentification)
   * Utilise roleGuard pour rediriger automatiquement selon le rôle:
   * - admin → /admin-home
   * - participant → /participant-home
   */
  {
    path: 'home',
    canActivate: [authGuard, roleGuard],
    children: [] // Pas de composant, juste une route de redirection
  },

  /**
   * Route admin-home: tableau de bord administrateur
   * Protégée par authGuard ET adminGuard
   * Seuls les utilisateurs avec role='admin' peuvent accéder
   */
  {
    path: 'admin-home',
    loadComponent: () => import('./pages/admin/admin-home/admin-home.page').then(m => m.AdminHomePage),
    canActivate: [authGuard, adminGuard]
  },

  /**
   * Route participant-home: tableau de bord participant
   * Protégée par authGuard ET participantGuard
   * Seuls les utilisateurs avec role='participant' peuvent accéder
   */
  {
    path: 'participant-home',
    loadComponent: () => import('./pages/participant-home/participant-home.page').then(m => m.ParticipantHomePage),
    canActivate: [authGuard, participantGuard]
  },

  /**
   * Route event-details: détails d'un événement
   * Accessible aux participants (pour voir et s'inscrire)
   * Protégée par authGuard et participantGuard
   */
  {
    path: 'event-details/:id',
    loadComponent: () => import('./pages/event-details/event-details.page').then(m => m.EventDetailsPage),
    canActivate: [authGuard, participantGuard]
  },

  /**
   * Route create-event: création d'événement
   * Accessible uniquement aux administrateurs
   * Protégée par authGuard et adminGuard
   */
  {
    path: 'create-event',
    loadComponent: () => import('./pages/admin/create-event/create-event.page').then(m => m.CreateEventPage),
    canActivate: [authGuard, adminGuard]
  },

  /**
   * Route 404: page non trouvée
   * Redirige vers /home qui gérera la redirection selon le rôle
   */
  {
    path: '**',
    redirectTo: 'home'
  }
];