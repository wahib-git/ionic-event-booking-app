import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';
import { EventService } from './event.service';

/**
 * Service responsable de la gestion des participations aux événements
 * Permet aux participants de s'inscrire et se désinscrire des événements
 * Gère aussi la vérification des places disponibles
 */
@Injectable({
  providedIn: 'root'
})
export class ParticipationService {

  /**
   * Constructeur du service
   * @param firestore Instance Firestore pour accéder à la base de données
   * @param eventService Service des événements pour gérer les compteurs
   */
  constructor(
    private firestore: Firestore,
    private eventService: EventService
  ) {}

  /**
   * Inscrit un utilisateur à un événement
   * Vérifie d'abord la disponibilité des places avant l'inscription
   * 
   * @param userId ID de l'utilisateur qui s'inscrit
   * @param eventId ID de l'événement auquel s'inscrire
   * @returns Promise qui se résout avec true si inscription réussie, false sinon
   * @throws Error si l'événement est complet ou si l'utilisateur est déjà inscrit
   */
  async joinEvent(userId: string, eventId: string): Promise<boolean> {
    // Vérification 1: L'utilisateur est-il déjà inscrit ?
    const alreadyJoined = await this.isUserJoined(userId, eventId);
    if (alreadyJoined) {
      throw new Error('Vous êtes déjà inscrit à cet événement');
    }

    // Vérification 2: Y a-t-il encore des places disponibles ?
    const hasSpots = await this.eventService.hasAvailableSpots(eventId);
    if (!hasSpots) {
      throw new Error('Cet événement est complet');
    }

    // Référence au document de participation dans la collection 'participations'
    // Structure: participations/{eventId}/participants/{userId}
    const participationRef = doc(
      this.firestore, 
      `participations/${eventId}/participants/${userId}`
    );

    try {
      // Création du document de participation
      await setDoc(participationRef, {
        userId,
        eventId,
        joinedAt: serverTimestamp() // Date d'inscription côté serveur
      });

      // Incrémentation du compteur de participants de l'événement
      await this.eventService.incrementParticipantsCount(eventId);

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'inscription à l\'événement:', error);
      throw new Error('Impossible de s\'inscrire à l\'événement');
    }
  }

  /**
   * Désinscrit un utilisateur d'un événement
   * Supprime la participation et décrémente le compteur
   * 
   * @param userId ID de l'utilisateur qui se désinscrit
   * @param eventId ID de l'événement duquel se désinscrire
   * @returns Promise qui se résout après la désinscription
   */
  async leaveEvent(userId: string, eventId: string): Promise<void> {
    // Référence au document de participation à supprimer
    const participationRef = doc(
      this.firestore, 
      `participations/${eventId}/participants/${userId}`
    );

    try {
      // Suppression du document de participation
      await deleteDoc(participationRef);

      // Décrémentation du compteur de participants de l'événement
      await this.eventService.decrementParticipantsCount(eventId);
    } catch (error) {
      console.error('Erreur lors de la désinscription de l\'événement:', error);
      throw new Error('Impossible de se désinscrire de l\'événement');
    }
  }

  /**
   * Vérifie si un utilisateur est déjà inscrit à un événement
   * Utilisé pour afficher le bon bouton (S'inscrire vs Se désinscrire)
   * 
   * @param userId ID de l'utilisateur
   * @param eventId ID de l'événement
   * @returns Promise<boolean> true si inscrit, false sinon
   */
  async isUserJoined(userId: string, eventId: string): Promise<boolean> {
    // Référence au document de participation
    const participationRef = doc(
      this.firestore, 
      `participations/${eventId}/participants/${userId}`
    );

    // Récupération du document
    const docSnap = await getDoc(participationRef);

    // Retour de l'existence du document
    return docSnap.exists();
  }

  /**
   * Récupère tous les événements auxquels un utilisateur est inscrit
   * Utilisé pour afficher "Mes événements" dans le profil utilisateur
   * 
   * @param userId ID de l'utilisateur
   * @returns Observable<string[]> Liste des IDs d'événements
   */
  getUserEvents(userId: string): Observable<string[]> {
    // Cette méthode nécessite une requête sur toutes les sous-collections
    // Pour optimiser, on pourrait créer une collection 'userParticipations/{userId}/events'
    
    // Pour l'instant, retournons un Observable vide
    // À implémenter selon l'architecture choisie
    return from(Promise.resolve([]));
  }

  /**
   * Récupère la liste des participants d'un événement
   * Utilisé par les administrateurs pour voir qui est inscrit
   * 
   * @param eventId ID de l'événement
   * @returns Observable<string[]> Liste des IDs des participants
   */
  getEventParticipants(eventId: string): Observable<string[]> {
    // Référence à la sous-collection des participants
    const participantsRef = collection(
      this.firestore, 
      `participations/${eventId}/participants`
    );

    // Récupération de tous les documents de participants
    return from(getDocs(participantsRef)).pipe(
      map(snapshot => {
        // Extraction des IDs utilisateurs
        return snapshot.docs.map(doc => doc.id);
      })
    );
  }

  /**
   * Compte le nombre de participants d'un événement
   * Alternative à la propriété participantsCount pour vérification
   * 
   * @param eventId ID de l'événement
   * @returns Promise<number> Nombre de participants
   */
  async countEventParticipants(eventId: string): Promise<number> {
    // Référence à la sous-collection des participants
    const participantsRef = collection(
      this.firestore, 
      `participations/${eventId}/participants`
    );

    // Récupération et comptage des documents
    const snapshot = await getDocs(participantsRef);
    return snapshot.size;
  }
}