import { Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
  onAuthStateChanged,
  User
} from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  private currentRoleSubject = new BehaviorSubject<string | null>(null);
  public currentRole$: Observable<string | null> = this.currentRoleSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();

  constructor(private auth: Auth, private firestore: Firestore) {
    // Pas de setPersistence() - cela cause des erreurs
    this.initializeAuthState();
  }

  // Initialiser l'état d'authentification
  private initializeAuthState() {
    console.log(' Initialisation de l\'état d\'authentification');
    onAuthStateChanged(this.auth, async (user: User | null) => {
      console.log('👤 Utilisateur changé:', user?.uid || 'null');
      this.currentUserSubject.next(user);
      
      if (user) {
        try {
          const role = await this.getUserRole(user.uid);
          console.log(' Rôle chargé:', role);
          this.currentRoleSubject.next(role);
        } catch (error: any) {
          console.error(' Erreur rôle:', error.message);
          this.currentRoleSubject.next(null);
        }
      } else {
        this.currentRoleSubject.next(null);
      }
    });
  }

  // Inscription
  async register(
    email: string,
    password: string,
    role: 'admin' | 'participant',
    name?: string
  ): Promise<UserCredential> {
    this.isLoadingSubject.next(true);
    try {
      console.log(' Inscription:', email);
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);

      await setDoc(doc(this.firestore, `users/${userCredential.user.uid}`), {
        uid: userCredential.user.uid,
        email,
        role,
        name: name || email.split('@')[0],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      });

      console.log(' Utilisateur créé');
      this.isLoadingSubject.next(false);
      return userCredential;

    } catch (error: any) {
      console.error('Erreur inscription:', error.message);
      this.isLoadingSubject.next(false);
      throw error;
    }
  }

  // Connexion
  async login(email: string, password: string): Promise<UserCredential> {
    this.isLoadingSubject.next(true);
    try {
      console.log(' Connexion:', email);
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      console.log(' Connecté');
      this.isLoadingSubject.next(false);
      return userCredential;

    } catch (error: any) {
      console.error(' Erreur connexion:', error.message);
      this.isLoadingSubject.next(false);
      throw error;
    }
  }

  // Récupérer le rôle
  async getUserRole(uid: string): Promise<string | null> {
    try {
      if (!uid) return null;

      console.log('Récupération du rôle:', uid);
      const userDoc = await getDoc(doc(this.firestore, `users/${uid}`));

      if (userDoc.exists()) {
        const role = userDoc.data()['role'];
        console.log('Rôle trouvé:', role);
        return role || null;
      }
      return null;

    } catch (error: any) {
      console.error(' Erreur getUserRole:', error.message);
      throw error;
    }
  }

  // Récupérer les données utilisateur
  async getUserData(uid: string): Promise<any> {
    try {
      if (!uid) return null;

      const userDoc = await getDoc(doc(this.firestore, `users/${uid}`));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;

    } catch (error: any) {
      console.error(' Erreur getUserData:', error.message);
      throw error;
    }
  }

  // Déconnexion
  async logout(): Promise<void> {
    try {
      console.log(' Déconnexion');
      await signOut(this.auth);
      this.currentUserSubject.next(null);
      this.currentRoleSubject.next(null);
      console.log('Déconnecté');

    } catch (error: any) {
      console.error(' Erreur logout:', error.message);
      throw error;
    }
  }

  // Vérifier si authentifié
  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  // Obtenir l'utilisateur actuel
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Obtenir le rôle actuel
  getCurrentRole(): string | null {
    return this.currentRoleSubject.value;
  }
}