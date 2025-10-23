import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';
import { authState } from '@angular/fire/auth';

/**
 * Guard d'authentification pour protéger les routes
 * Vérifie si l'utilisateur est connecté avant d'autoriser l'accès à une route
 * Redirige vers la page de login si l'utilisateur n'est pas authentifié
 * 
 * Utilisation dans le routing:
 * {
 *   path: 'home',
 *   component: HomePage,
 *   canActivate: [authGuard]
 * }
 */
export const authGuard = () => {
  // Injection des dépendances (nouvelle syntaxe Angular standalone)
  const auth = inject(Auth);
  const router = inject(Router);

  // Retourne un Observable qui émet true/false selon l'état d'authentification
  return authState(auth).pipe(
    // take(1) pour ne prendre que la première émission et compléter
    take(1),
    
    // Transformation de l'état auth en booléen de permission
    map(user => {
      // Si l'utilisateur est connecté (user existe)
      if (user) {
        // Autoriser l'accès à la route
        return true;
      } else {
        // Utilisateur non connecté: redirection vers login
        console.log('Accès refusé: utilisateur non authentifié');
        router.navigate(['/login']);
        return false;
      }
    })
  );
};

/**
 * Guard alternatif pour les pages publiques (login, register)
 * Redirige les utilisateurs déjà connectés vers leur page d'accueil
 * 
 * Utilisation dans le routing:
 * {
 *   path: 'login',
 *   component: LoginPage,
 *   canActivate: [guestGuard]
 * }
 */
export const guestGuard = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return authState(auth).pipe(
    take(1),
    map(user => {
      // Si l'utilisateur est déjà connecté
      if (user) {
        // Rediriger vers la page d'accueil
        console.log('Utilisateur déjà connecté, redirection...');
        router.navigate(['/home']);
        return false; // Bloquer l'accès à la page de login
      } else {
        // Utilisateur non connecté: autoriser l'accès
        return true;
      }
    })
  );
};