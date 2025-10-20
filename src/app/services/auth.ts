import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from '@angular/fire/auth';// Importation des fonctions d’authentification Firebase

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private auth: Auth) {}

  // Inscription d'un nouvel utilisateur
  register(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  // Connexion d'un utilisateur existant
  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  //  Déconnexion
  logout() {
    return signOut(this.auth);
  }
}
