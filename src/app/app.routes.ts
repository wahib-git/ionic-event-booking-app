import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/auth/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'admin-home',
    loadComponent: () => import('./pages/admin/admin-home/admin-home.page').then( m => m.AdminHomePage)
  },
  {
    path: 'participant-home',
    loadComponent: () => import('./pages/participant-home/participant-home.page').then( m => m.ParticipantHomePage)
  },
  {
    path: 'create-event',
    loadComponent: () => import('./pages/admin/create-event/create-event.page').then( m => m.CreateEventPage)
  },
  {
    path: 'event-details',
    loadComponent: () => import('./pages/event-details/event-details.page').then( m => m.EventDetailsPage)
  },
  {
    path: 'event-details',
    loadComponent: () => import('./pages/event-details/event-details.page').then( m => m.EventDetailsPage)
  },



];