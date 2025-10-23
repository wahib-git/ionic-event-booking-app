import { Injectable } from '@angular/core';
import { Firestore, doc, setDoc, getDoc, serverTimestamp } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { User } from '../models/models';

/**
 * Service responsable de la gestion des utilisateurs dans Firestore
 * Gère la création de profils utilisateur et la récupération des données
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  
  /**
   * Constructeur du service
   * @param firestore Instance Firestore injectée pour accéder à la base de données
   */
  constructor(private firestore: Firestore) {}

  /**
   * Crée un nouveau profil utilisateur dans Firestore après l'inscription
   * Cette méthode est appelée juste après la création du compte Firebase Auth
   * 
   * @param uid Identifiant unique de l'utilisateur (provenant de Firebase Auth)
   * @param email Adresse email de l'utilisateur
   * @param role Rôle assigné à l'utilisateur ('admin' ou 'participant')
   * @returns Promise qui se résout quand le profil est créé
   */
  async createUserProfile(uid: string, email: string, role: 'admin' | 'participant'): Promise<void> {
    // Référence au document utilisateur dans la collection 'users'
    const userRef = doc(this.firestore, `users/${uid}`);
    
    // Création de l'objet utilisateur avec les données initiales
    const userData: Omit<User, 'uid'> = {
      email,
      role,
      createdAt: serverTimestamp() // Timestamp côté serveur pour cohérence
    };
    
    // Enregistrement du profil dans Firestore
    await setDoc(userRef, userData);
  }

  /**
   * Récupère le profil complet d'un utilisateur depuis Firestore
   * Cette méthode est utilisée pour vérifier le rôle et les informations de l'utilisateur
   * 
   * @param uid Identifiant unique de l'utilisateur
   * @returns Observable contenant les données utilisateur ou null si non trouvé
   */
  getUserProfile(uid: string): Observable<User | null> {
    // Référence au document utilisateur
    const userRef = doc(this.firestore, `users/${uid}`);
    
    // Conversion de la Promise en Observable pour intégration RxJS
    return from(
      getDoc(userRef).then(docSnap => {
        // Vérification de l'existence du document
        if (docSnap.exists()) {
          // Retour des données avec l'UID inclus
          return { 
            uid, 
            ...docSnap.data() 
          } as User;
        }
        // Retour null si l'utilisateur n'existe pas
        return null;
      })
    );
  }

  /**
   * Met à jour le nom d'affichage d'un utilisateur
   * Permet à l'utilisateur de personnaliser son profil
   * 
   * @param uid Identifiant unique de l'utilisateur
   * @param displayName Nouveau nom d'affichage
   * @returns Promise qui se résout après la mise à jour
   */
  async updateDisplayName(uid: string, displayName: string): Promise<void> {
    // Référence au document utilisateur
    const userRef = doc(this.firestore, `users/${uid}`);
    
    // Mise à jour partielle du document (seulement displayName)
    await setDoc(userRef, { displayName }, { merge: true });
  }

  /**
   * Vérifie si un utilisateur a le rôle administrateur
   * Utile pour les guards de navigation et l'affichage conditionnel
   * 
   * @param uid Identifiant unique de l'utilisateur
   * @returns Promise<boolean> true si admin, false sinon
   */
  async isAdmin(uid: string): Promise<boolean> {
    // Référence au document utilisateur
    const userRef = doc(this.firestore, `users/${uid}`);
    
    // Récupération du document
    const docSnap = await getDoc(userRef);
    
    // Vérification de l'existence et du rôle
    if (docSnap.exists()) {
      const userData = docSnap.data() as User;
      return userData.role === 'admin';
    }
    
    // Par défaut, retourner false si l'utilisateur n'existe pas
    return false;
  }
}