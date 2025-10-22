import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { EventService, Event } from 'src/app/services/event.service';
import { AuthService } from 'src/app/services/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './admin-home.page.html',
  styleUrls: ['./admin-home.page.scss'],
})
export class AdminHomePage implements OnInit, OnDestroy {
  userName: string = '';
  events: Event[] = [];
  isLoading = false;
  private subscriptions: Subscription = new Subscription();

  stats = {
    totalEvents: 0,
    activeEvents: 0,
    totalParticipants: 0,
    upcomingEvents: 0
  };

  constructor(
    private authService: AuthService,
    private eventService: EventService,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('AdminHomePage initialisée');
    // Utiliser l'observable au lieu de getCurrentUser() qui peut être null
    this.subscribeToAuthState();
  }

  // CORRECTION CLÉE : S'abonner à l'état d'authentification au lieu de le vérifier directement
  private subscribeToAuthState() {
    console.log(' Écoute de l\'état d\'authentification...');
    
    const userSub = this.authService.currentUser$.subscribe(async (user) => {
      console.log(' Utilisateur observé:', user?.uid || 'null');
      
      if (!user) {
        console.warn(' Pas d\'utilisateur, redirection vers login');
        this.router.navigate(['/login']);
        return;
      }

      console.log(' Utilisateur authentifié:', user.uid);
      // Maintenant que l'utilisateur existe, charger le dashboard
      await this.initDashboard(user.uid);
    });

    this.subscriptions.add(userSub);
  }

  // Charger le dashboard avec l'uid garantis
  async initDashboard(uid: string) {
    this.isLoading = true;
    console.log(' Initialisation du dashboard pour uid:', uid);
    
    try {
      // Récupérer les données de l'utilisateur
      console.log(' Récupération des données utilisateur...');
      const userData = await this.authService.getUserData(uid);
      this.userName = userData?.name || 'Admin';
      console.log('Nom d\'utilisateur:', this.userName);

      // Charger les événements de l'admin
      console.log(' Chargement des événements admin...');
      this.events = await this.eventService.getAdminEvents(uid);
      console.log('Événements chargés:', this.events.length);

      // Calculer les statistiques
      this.calculateStats();
      console.log(' Statistiques calculées:', this.stats);

    } catch (error: any) {
      console.error('Erreur initialisation dashboard:', error);
      console.error('Détail erreur:', error.message);
      alert('Erreur : ' + error.message);
    } finally {
      this.isLoading = false;
      console.log(' Dashboard chargé');
    }
  }

  calculateStats() {
    const now = new Date();
    console.log(' Date actuelle:', now);

    // Total d'événements
    this.stats.totalEvents = this.events.length;
    console.log(' Total événements:', this.stats.totalEvents);

    // Événements actifs
    this.stats.activeEvents = this.events.filter(e => {
      console.log(`  - ${e.title}: status=${e.status}`);
      return e.status === 'active';
    }).length;
    console.log(' Événements actifs:', this.stats.activeEvents);

    // Total des participants inscrits
    this.stats.totalParticipants = this.events.reduce((sum, e) => {
      const count = e.registeredCount || 0;
      console.log(`  - ${e.title}: ${count} inscrits`);
      return sum + count;
    }, 0);
    console.log('👥 Total participants:', this.stats.totalParticipants);

    // Événements à venir
    this.stats.upcomingEvents = this.events.filter(e => {
      // Convertir la date Firestore en Date JS si nécessaire
      let eventDate: Date | null = null;
      
      if (e.date instanceof Date) {
        eventDate = e.date;
      } else if (e.date && typeof e.date === 'object' && 'toDate' in e.date) {
        // C'est un Timestamp Firestore
        eventDate = (e.date as any).toDate();
      } else {
        console.warn(`Format de date inconnu pour ${e.title}:`, e.date);
        return false;
      }

      const isUpcoming = eventDate !== null && eventDate > now && e.status === 'active';
      console.log(`  - ${e.title}: ${eventDate?.toLocaleDateString()} (${isUpcoming ? ' à venir' : ' passé'})`);
      return isUpcoming;
    }).length;
    console.log(' Événements à venir:', this.stats.upcomingEvents);
  }

  goToManageEvents() {
    console.log(' Navigation vers admin-event-list');
    this.router.navigate(['/admin-event-list']);
  }

  goToCreateEvent() {
    console.log(' Navigation vers admin-event-create');
    this.router.navigate(['/admin-event-create']);
  }

  async logout() {
    console.log('Déconnexion en cours...');
    try {
      await this.authService.logout();
      console.log(' Déconnecté');
      this.router.navigate(['/login']);
    } catch (error: any) {
      console.error(' Erreur déconnexion:', error.message);
      alert('Erreur déconnexion : ' + error.message);
    }
  }

  refreshDashboard() {
    console.log(' Actualisation du dashboard');
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.initDashboard(currentUser.uid);
    }
  }

  // Pour le debugging - afficher les événements en console
  debugEvents() {
    console.log('=== DEBUG EVENTS ===');
    this.events.forEach((e, index) => {
      console.log(`Événement ${index + 1}:`, {
        title: e.title,
        status: e.status,
        date: e.date,
        dateType: typeof e.date,
        hasToDate: e.date && typeof e.date === 'object' && 'toDate' in e.date,
        createdBy: e.createdBy,
        registeredCount: e.registeredCount,
        capacity: e.capacity
      });
    });
  }

  // Nettoyer les subscriptions
  ngOnDestroy() {
    console.log(' Nettoyage des subscriptions');
    this.subscriptions.unsubscribe();
  }
}