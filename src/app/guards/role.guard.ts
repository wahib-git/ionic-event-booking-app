import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { authState } from '@angular/fire/auth';
import { map, take, switchMap } from 'rxjs/operators';
import { from, of } from 'rxjs';
import { UserService } from '../services/user.service';

/**
 * Guard de rôle pour rediriger les utilisateurs selon leur rôle
 * Utilisé sur la route '/home' pour router automatiquement vers:
 * - '/admin-home' pour les administrateurs
 * - '/participant-home' pour les participants
 * 
 * Utilisation dans le routing:
 * {
 *   path: 'home',
 *   canActivate: [roleGuard]
 * }
 */
export const roleGuard = () => {
  // Injection des services nécessaires
  const auth = inject(Auth);
  const router = inject(Router);
  const userService = inject(UserService);

  // Pipeline RxJS pour gérer l'état d'authentification et le rôle
  return authState(auth).pipe(
    // Prendre seulement la première émission
    take(1),
    
    // switchMap pour passer de l'Observable auth à l'Observable du profil utilisateur
    switchMap(user => {
      // Si l'utilisateur n'est pas connecté
      if (!user) {
        console.log('Utilisateur non connecté, redirection vers login');
        router.navigate(['/login']);
        return of(false); // Retourner un Observable de false
      }

      // Récupération du profil utilisateur depuis Firestore
      return userService.getUserProfile(user.uid).pipe(
        map(userProfile => {
          // Si le profil n'existe pas dans Firestore
          if (!userProfile) {
            console.error('Profil utilisateur introuvable');
            router.navigate(['/login']);
            return false;
          }

          // Redirection basée sur le rôle
          if (userProfile.role === 'admin') {
            console.log('Redirection vers admin-home');
            router.navigate(['/admin-home']);
          } else if (userProfile.role === 'participant') {
            console.log('Redirection vers participant-home');
            router.navigate(['/participant-home']);
          } else {
            // Rôle non reconnu (ne devrait pas arriver)
            console.error('Rôle utilisateur non reconnu:', userProfile.role);
            router.navigate(['/login']);
          }

          // Retourner false car on a déjà fait la redirection
          return false;
        })
      );
    })
  );
};

/**
 * Guard pour protéger les routes administrateur
 * Vérifie que l'utilisateur connecté a le rôle 'admin'
 * Redirige vers participant-home si l'utilisateur n'est pas admin
 * 
 * Utilisation dans le routing:
 * {
 *   path: 'admin-home',
 *   component: AdminHomePage,
 *   canActivate: [adminGuard]
 * }
 */
export const adminGuard = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const userService = inject(UserService);

  return authState(auth).pipe(
    take(1),
    switchMap(user => {
      // Vérification de l'authentification
      if (!user) {
        console.log('Accès admin refusé: non authentifié');
        router.navigate(['/login']);
        return of(false);
      }

      // Vérification du rôle admin
      return from(userService.isAdmin(user.uid)).pipe(
        map(isAdmin => {
          if (isAdmin) {
            // Utilisateur est admin: autoriser l'accès
            return true;
          } else {
            // Utilisateur n'est pas admin: rediriger vers participant home
            console.log('Accès admin refusé: utilisateur non-admin');
            router.navigate(['/participant-home']);
            return false;
          }
        })
      );
    })
  );
};

/**
 * Guard pour protéger les routes participant
 * Vérifie que l'utilisateur connecté a le rôle 'participant'
 * Redirige vers admin-home si l'utilisateur est admin
 * 
 * Utilisation dans le routing:
 * {
 *   path: 'participant-home',
 *   component: ParticipantHomePage,
 *   canActivate: [participantGuard]
 * }
 */
export const participantGuard = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const userService = inject(UserService);

  return authState(auth).pipe(
    take(1),
    switchMap(user => {
      // Vérification de l'authentification
      if (!user) {
        console.log('Accès participant refusé: non authentifié');
        router.navigate(['/login']);
        return of(false);
      }

      // Récupération du profil pour vérifier le rôle
      return userService.getUserProfile(user.uid).pipe(
        map(userProfile => {
          if (!userProfile) {
            router.navigate(['/login']);
            return false;
          }

          if (userProfile.role === 'participant') {
            // Utilisateur est participant: autoriser l'accès
            return true;
          } else {
            // Utilisateur est admin: rediriger vers admin home
            console.log('Accès participant refusé: utilisateur admin');
            router.navigate(['/admin-home']);
            return false;
          }
        })
      );
    })
  );
};