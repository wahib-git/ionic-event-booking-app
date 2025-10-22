import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, orderBy, Timestamp } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Event {
  id?: string;
  title: string;
  description: string;
  date: Date | Timestamp;
  time: string;
  location: string;
  capacity: number;
  registeredCount?: number;
  category: string;
  image?: string;
  createdBy: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  status: 'active' | 'cancelled' | 'completed';
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private eventsSubject = new BehaviorSubject<Event[]>([]);
  public events$: Observable<Event[]> = this.eventsSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();

  constructor(private firestore: Firestore) {}

  // Récupérer tous les événements
  async getAllEvents(): Promise<Event[]> {
    this.isLoadingSubject.next(true);
    try {
      const eventsRef = collection(this.firestore, 'events');
      const q = query(eventsRef, orderBy('date', 'asc'));
      const snapshot = await getDocs(q);

      const events: Event[] = [];
      snapshot.forEach((doc) => {
        events.push({
          id: doc.id,
          ...doc.data() as Event
        });
      });

      this.eventsSubject.next(events);
      console.log(' Événements chargés:', events.length);
      return events;

    } catch (error: any) {
      console.error(' Erreur getAllEvents:', error.message);
      throw error;
    } finally {
      this.isLoadingSubject.next(false);
    }
  }

  // Récupérer les événements d'un admin - VERSION SIMPLIFIÉE (sans orderBy composite)
  async getAdminEvents(adminId: string): Promise<Event[]> {
    this.isLoadingSubject.next(true);
    try {
      console.log(' Récupération des événements pour admin:', adminId);
      
      const eventsRef = collection(this.firestore, 'events');
      
      // SOLUTION: Juste filtrer par createdBy, SANS orderBy composite
      // Cela évite le besoin d'un index composite
      const q = query(
        eventsRef,
        where('createdBy', '==', adminId)
      );
      
      const snapshot = await getDocs(q);

      const events: Event[] = [];
      snapshot.forEach((doc) => {
        events.push({
          id: doc.id,
          ...doc.data() as Event
        });
      });

      
      events.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : (a.createdAt as any)?.toDate?.() || new Date(0);
        const dateB = b.createdAt instanceof Date ? b.createdAt : (b.createdAt as any)?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime(); 
      });

      console.log(' Événements admin chargés:', events.length);
      return events;

    } catch (error: any) {
      console.error(' Erreur getAdminEvents:', error.message);
      throw error;
    } finally {
      this.isLoadingSubject.next(false);
    }
  }

  // Récupérer un événement par ID
  async getEventById(eventId: string): Promise<Event | null> {
    try {
      const eventRef = doc(this.firestore, 'events', eventId);
      const snapshot = await getDoc(eventRef);

      if (snapshot.exists()) {
        return {
          id: snapshot.id,
          ...snapshot.data() as Event
        };
      }
      return null;

    } catch (error: any) {
      console.error(' Erreur getEventById:', error.message);
      throw error;
    }
  }

  // Créer un événement
  async createEvent(event: Event): Promise<string> {
    this.isLoadingSubject.next(true);
    try {
      console.log(' Création d\'événement:', event.title);

      const eventsRef = collection(this.firestore, 'events');
      const docRef = await addDoc(eventsRef, {
        ...event,
        registeredCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        date: event.date instanceof Date ? Timestamp.fromDate(event.date) : event.date,
        status: 'active'
      });

      console.log(' Événement créé avec ID:', docRef.id);
      
      // Recharger la liste
      await this.getAllEvents();
      
      return docRef.id;

    } catch (error: any) {
      console.error(' Erreur createEvent:', error.message);
      throw error;
    } finally {
      this.isLoadingSubject.next(false);
    }
  }

  // Modifier un événement
  async updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
    this.isLoadingSubject.next(true);
    try {
      console.log(' Modification d\'événement:', eventId);

      const eventRef = doc(this.firestore, 'events', eventId);
      
      const dataToUpdate: any = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      // Si la date est un objet Date, la convertir en Timestamp
      if (updates.date instanceof Date) {
        dataToUpdate.date = Timestamp.fromDate(updates.date);
      }

      await updateDoc(eventRef, dataToUpdate);

      console.log(' Événement modifié');
      
      // Recharger la liste
      await this.getAllEvents();

    } catch (error: any) {
      console.error(' Erreur updateEvent:', error.message);
      throw error;
    } finally {
      this.isLoadingSubject.next(false);
    }
  }

  // Supprimer un événement
  async deleteEvent(eventId: string): Promise<void> {
    this.isLoadingSubject.next(true);
    try {
      console.log(' Suppression d\'événement:', eventId);

      const eventRef = doc(this.firestore, 'events', eventId);
      await deleteDoc(eventRef);

      console.log(' Événement supprimé');
      
      // Recharger la liste
      await this.getAllEvents();

    } catch (error: any) {
      console.error(' Erreur deleteEvent:', error.message);
      throw error;
    } finally {
      this.isLoadingSubject.next(false);
    }
  }

  // Obtenir les événements en cache
  getEventsFromCache(): Event[] {
    return this.eventsSubject.value;
  }

  // Chercher les événements par catégorie
  async getEventsByCategory(category: string): Promise<Event[]> {
    try {
      const eventsRef = collection(this.firestore, 'events');
      const q = query(
        eventsRef,
        where('category', '==', category),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);

      const events: Event[] = [];
      snapshot.forEach((doc) => {
        events.push({
          id: doc.id,
          ...doc.data() as Event
        });
      });

      return events;

    } catch (error: any) {
      console.error(' Erreur getEventsByCategory:', error.message);
      throw error;
    }
  }

  // Incrémenter le nombre d'inscrits
  async incrementRegisteredCount(eventId: string): Promise<void> {
    try {
      const eventRef = doc(this.firestore, 'events', eventId);
      const eventSnap = await getDoc(eventRef);

      if (eventSnap.exists()) {
        const currentCount = eventSnap.data()['registeredCount'] || 0;
        await updateDoc(eventRef, {
          registeredCount: currentCount + 1,
          updatedAt: Timestamp.now()
        });
      }

    } catch (error: any) {
      console.error(' Erreur incrementRegisteredCount:', error.message);
      throw error;
    }
  }
}