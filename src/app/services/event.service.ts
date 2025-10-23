import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  collectionData,
  docData,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  updateDoc,
  increment,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Event, EventCreateDto } from '../models/models';

/**
 * Service responsable de la gestion des événements communautaires
 * Gère la création, suppression, récupération et mise à jour des événements
 * Uniquement accessible aux administrateurs pour la création/suppression
 */
@Injectable({
  providedIn: 'root',
})
export class EventService {
  /**
   * Constructeur du service
   * @param firestore Instance Firestore injectée pour accéder à la base de données
   */
  constructor(private firestore: Firestore) {}

  /**
   * Crée un nouvel événement dans Firestore
   * Cette méthode doit être appelée uniquement par les administrateurs
   *
   * @param eventData Données de l'événement à créer (sans ID)
   * @param createdBy UID de l'administrateur qui crée l'événement
   * @returns Promise<string> ID du nouvel événement créé
   */
  async createEvent(
    eventData: EventCreateDto,
    createdBy: string
  ): Promise<string> {
    // Référence à la collection 'events'
    const eventsRef = collection(this.firestore, 'events');

    // Conversion de la date ISO en Timestamp Firebase
    const dateDebut = Timestamp.fromDate(new Date(eventData.dateDebut));

    // Préparation de l'objet événement complet
    const event: Omit<Event, 'id'> = {
      nom: eventData.nom,
      description: eventData.description,
      dateDebut,
      lieu: eventData.lieu,
      nombreMaxParticipants: eventData.nombreMaxParticipants,
      imageUrl: eventData.imageUrl,
      createdBy,
      createdAt: serverTimestamp(), // Timestamp côté serveur
      participantsCount: 0, // Initialisé à 0 participants
    };

    // Ajout du document à la collection et récupération de son ID
    const docRef = await addDoc(eventsRef, event);

    return docRef.id;
  }

  /**
   * Récupère tous les événements, triés par date de début (du plus récent au plus ancien)
   * Accessible à tous les utilisateurs (admin et participants)
   *
   * @returns Observable<Event[]> Liste de tous les événements
   */
  getAllEvents(): Observable<Event[]> {
    // Référence à la collection 'events'
    const eventsRef = collection(this.firestore, 'events');

    // Création d'une requête avec tri par date de début (descendant)
    const eventsQuery = query(eventsRef, orderBy('dateDebut', 'desc'));

    // collectionData retourne un Observable temps réel et gère le contexte d'injection
    return collectionData(eventsQuery, { idField: 'id' }) as Observable<
      Event[]
    >;
  }

  /**
   * Récupère un événement spécifique par son ID
   * Utilisé pour afficher les détails d'un événement
   *
   * @param eventId ID de l'événement à récupérer
   * @returns Observable<Event | null> Données de l'événement ou null si non trouvé
   */
  getEventById(eventId: string): Observable<Event | null> {
    // Référence au document spécifique
    const eventRef = doc(this.firestore, `events/${eventId}`);

    // docData retourne un Observable et gère le contexte d'injection
    return docData(eventRef, { idField: 'id' }) as Observable<Event | null>;
  }

  /**
   * Supprime un événement de la base de données
   * Cette méthode doit être appelée uniquement par les administrateurs
   * ATTENTION: Cette opération est irréversible
   *
   * @param eventId ID de l'événement à supprimer
   * @returns Promise qui se résout après la suppression
   */
  async deleteEvent(eventId: string): Promise<void> {
    // Référence au document à supprimer
    const eventRef = doc(this.firestore, `events/${eventId}`);

    // Suppression du document
    await deleteDoc(eventRef);

    // TODO: En production, supprimer aussi les participations associées
    // via une Cloud Function ou une transaction
  }

  /**
   * Incrémente le compteur de participants d'un événement
   * Appelé automatiquement lors de l'inscription d'un participant
   *
   * @param eventId ID de l'événement
   * @returns Promise qui se résout après l'incrémentation
   */
  async incrementParticipantsCount(eventId: string): Promise<void> {
    const eventRef = doc(this.firestore, `events/${eventId}`);

    // Utilisation d'increment pour une opération atomique côté serveur
    await updateDoc(eventRef, {
      participantsCount: increment(1),
    });
  }

  /**
   * Décrémente le compteur de participants d'un événement
   * Appelé automatiquement lors de la désinscription d'un participant
   *
   * @param eventId ID de l'événement
   * @returns Promise qui se résout après la décrémentation
   */
  async decrementParticipantsCount(eventId: string): Promise<void> {
    const eventRef = doc(this.firestore, `events/${eventId}`);

    // Utilisation d'increment(-1) pour une opération atomique côté serveur
    await updateDoc(eventRef, {
      participantsCount: increment(-1),
    });
  }

  /**
   * Vérifie si un événement a encore des places disponibles
   * Utilisé avant d'autoriser une inscription
   *
   * @param eventId ID de l'événement
   * @returns Promise<boolean> true si des places sont disponibles, false sinon
   */
  async hasAvailableSpots(eventId: string): Promise<boolean> {
    const eventRef = doc(this.firestore, `events/${eventId}`);
    // Utilisation de docData + toPromise pour one-shot
    const event$ = docData(eventRef, {
      idField: 'id',
    }) as Observable<Event | null>;
    const event = await new Promise<Event | null>((resolve) => {
      const sub = event$.subscribe((e) => {
        sub.unsubscribe();
        resolve(e);
      });
    });

    if (!event) return false;
    return (event.participantsCount ?? 0) < (event.nombreMaxParticipants ?? 0);
  }
}
