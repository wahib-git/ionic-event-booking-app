import { Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from '@angular/fire/auth';
import { Observable, firstValueFrom } from 'rxjs';
import { authState } from '@angular/fire/auth';
import { UserService } from './user.service';

/**
 * Service d'authentification Firebase
 * Gère l'inscription, la connexion et la déconnexion des utilisateurs
 * Intégré avec UserService pour créer automatiquement les profils
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Observable de l'état d'authentification
  user$: Observable<User | null>;

  /**
   * Constructeur du service
   * @param auth Instance Firebase Auth
   * @param userService Service utilisateur pour créer les profils
   */
  constructor(private auth: Auth, private userService: UserService) {
    // Initialisation de l'observable user$
    this.user$ = authState(this.auth);
  }

  /**
   * Inscrit un nouvel utilisateur avec email et mot de passe
   * Crée automatiquement le profil utilisateur dans Firestore
   *
   * @param email Adresse email de l'utilisateur
   * @param password Mot de passe
   * @param role Rôle de l'utilisateur ('admin' ou 'participant')
   * @returns Promise<UserCredential> Informations de l'utilisateur créé
   */
  async register(
    email: string,
    password: string,
    role: 'admin' | 'participant'
  ): Promise<any> {
    try {
      // Étape 1: Création du compte Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      console.log('Compte Firebase Auth créé:', userCredential.user.uid);

      // Étape 2: Création du profil utilisateur dans Firestore
      await this.userService.createUserProfile(
        userCredential.user.uid,
        email,
        role
      );

      console.log('Profil utilisateur créé dans Firestore');

      return userCredential;
    } catch (error: any) {
      // Gestion des erreurs d'inscription
      console.error("Erreur lors de l'inscription:", error);

      // Transformation des erreurs Firebase en messages lisibles
      let errorMessage = "Erreur lors de l'inscription";

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Cette adresse email est déjà utilisée';
          break;
        case 'auth/weak-password':
          errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Adresse email invalide';
          break;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Connecte un utilisateur avec email et mot de passe
   *
   * @param email Adresse email
   * @param password Mot de passe
   * @returns Promise<UserCredential> Informations de l'utilisateur connecté
   */
  async login(email: string, password: string): Promise<any> {
    try {
      // Tentative de connexion Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      console.log('Utilisateur connecté:', userCredential.user.uid);

      return userCredential;
    } catch (error: any) {
      // Gestion des erreurs de connexion
      console.error('Erreur lors de la connexion:', error);

      let errorMessage = 'Erreur lors de la connexion';

      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Email ou mot de passe incorrect';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Adresse email invalide';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Ce compte a été désactivé';
          break;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Déconnecte l'utilisateur actuel
   *
   * @returns Promise qui se résout après la déconnexion
   */
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      console.log('Utilisateur déconnecté');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      throw new Error('Erreur lors de la déconnexion');
    }
  }

  /**
   * Récupère l'utilisateur actuellement connecté
   *
   * @returns User | null Utilisateur actuel ou null si non connecté
   */
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  /**
   * Vérifie si un utilisateur est connecté
   *
   * @returns boolean true si connecté, false sinon
   */
  isAuthenticated(): boolean {
    return this.auth.currentUser !== null;
  }

  /**
   * Retourne le rôle de l'utilisateur ('admin' | 'participant') ou null si non trouvé
   */
  async getUserRole(uid: string): Promise<'admin' | 'participant' | null> {
    if (!uid) return null;
    const profile = await firstValueFrom(this.userService.getUserProfile(uid));
    return profile ? profile.role : null;
  }
}
