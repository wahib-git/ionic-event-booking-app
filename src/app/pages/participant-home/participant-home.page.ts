import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonIcon, IonButtons, IonBadge, IonChip, AlertController, LoadingController, ToastController, IonSpinner, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendar,
  location,
  people,
  logOut,
  personCircle,
  checkmarkCircle,
  closeCircle,
  addCircle
} from 'ionicons/icons';
import { Auth, signOut } from '@angular/fire/auth';
import { EventService } from '../../services/event.service';
import { ParticipationService } from '../../services/participation.service';
import { Event } from '../../models/models';

/**
 * Page d'accueil pour les participants
 * Affiche tous les événements disponibles avec possibilité de:
 * - S'inscrire aux événements
 * - Se désinscrire des événements
 * - Voir les places disponibles
 * - Se déconnecter
 */
@Component({
  selector: 'app-participant-home',
  templateUrl: './participant-home.page.html',
  styleUrls: ['./participant-home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonIcon,
    IonButtons,
    IonBadge,
    IonChip,
    IonSpinner,
    IonLabel
]
})
export class ParticipantHomePage implements OnInit {
  // Liste des événements disponibles
  events: Event[] = [];
  
  // Map pour stocker l'état de participation de l'utilisateur
  // Key: eventId, Value: boolean (true si inscrit)
  userParticipations: Map<string, boolean> = new Map();
  
  // Indicateur de chargement
  isLoading = true;
  
  // ID de l'utilisateur connecté
  currentUserId: string = '';

  /**
   * Constructeur avec injection des dépendances
   */
  constructor(
    private eventService: EventService,
    private participationService: ParticipationService,
    private auth: Auth,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    // Enregistrement des icônes utilisées
    addIcons({
      calendar,
      location,
      people,
      logOut,
      personCircle,
      checkmarkCircle,
      closeCircle,
      addCircle
    });
  }

  /**
   * Lifecycle hook: initialisation du composant
   */
  ngOnInit() {
    // Récupération de l'ID utilisateur
    const user = this.auth.currentUser;
    if (user) {
      this.currentUserId = user.uid;
      this.loadEvents();
    }
  }

  /**
   * Charge tous les événements et vérifie les participations de l'utilisateur
   */
  loadEvents() {
    this.isLoading = true;

    // Récupération de tous les événements
    this.eventService.getAllEvents().subscribe({
      next: async (events) => {
        this.events = events;
        
        // Vérification de la participation pour chaque événement
        await this.checkUserParticipations();
        
        this.isLoading = false;
        console.log(`${events.length} événements chargés`);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des événements:', error);
        this.isLoading = false;
        this.showToast('Erreur lors du chargement des événements', 'danger');
      }
    });
  }

  /**
   * Vérifie pour chaque événement si l'utilisateur y est inscrit
   * Remplit la Map userParticipations
   */
  private async checkUserParticipations() {
    // Parcours de tous les événements
    for (const event of this.events) {
      if (event.id) {
        try {
          // Vérification de la participation
          const isJoined = await this.participationService.isUserJoined(
            this.currentUserId,
            event.id
          );
          
          // Stockage du résultat dans la Map
          this.userParticipations.set(event.id, isJoined);
        } catch (error) {
          console.error(`Erreur lors de la vérification pour l'événement ${event.id}:`, error);
        }
      }
    }
  }

  /**
   * Gère l'inscription/désinscription à un événement
   * @param event Événement concerné
   */
  async toggleParticipation(event: Event) {
    if (!event.id) return;

    // Vérifier si l'utilisateur est déjà inscrit
    const isJoined = this.userParticipations.get(event.id) || false;

    if (isJoined) {
      // Désinscription
      await this.leaveEvent(event);
    } else {
      // Inscription
      await this.joinEvent(event);
    }
  }

  /**
   * Inscrit l'utilisateur à un événement
   * @param event Événement auquel s'inscrire
   */
  private async joinEvent(event: Event) {
    if (!event.id) return;

    // Vérification des places disponibles
    if (!this.hasAvailableSpots(event)) {
      this.showToast('Cet événement est complet', 'warning');
      return;
    }

    // Affichage du loader
    const loading = await this.loadingController.create({
      message: 'Inscription en cours...'
    });
    await loading.present();

    try {
      // Appel au service pour s'inscrire
      await this.participationService.joinEvent(this.currentUserId, event.id);
      
      // Mise à jour de l'état local
      this.userParticipations.set(event.id, true);
      
      // Rechargement des événements pour mettre à jour les compteurs
      this.loadEvents();
      
      await loading.dismiss();
      this.showToast(`Vous êtes inscrit à "${event.nom}"`, 'success');
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error);
      await loading.dismiss();
      this.showToast(error.message || 'Erreur lors de l\'inscription', 'danger');
    }
  }

  /**
   * Désinscrit l'utilisateur d'un événement
   * @param event Événement duquel se désinscrire
   */
  private async leaveEvent(event: Event) {
    if (!event.id) return;

    // Dialogue de confirmation
    const alert = await this.alertController.create({
      header: 'Confirmer la désinscription',
      message: `Voulez-vous vraiment vous désinscrire de "${event.nom}" ?`,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Se désinscrire',
          role: 'destructive',
          handler: async () => {
            await this.performLeave(event);
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Effectue la désinscription réelle
   * @param event Événement concerné
   */
  private async performLeave(event: Event) {
    if (!event.id) return;

    const loading = await this.loadingController.create({
      message: 'Désinscription en cours...'
    });
    await loading.present();

    try {
      // Appel au service pour se désinscrire
      await this.participationService.leaveEvent(this.currentUserId, event.id);
      
      // Mise à jour de l'état local
      this.userParticipations.set(event.id, false);
      
      // Rechargement des événements
      this.loadEvents();
      
      await loading.dismiss();
      this.showToast(`Vous êtes désinscrit de "${event.nom}"`, 'success');
    } catch (error) {
      console.error('Erreur lors de la désinscription:', error);
      await loading.dismiss();
      this.showToast('Erreur lors de la désinscription', 'danger');
    }
  }

  /**
   * Vérifie si un événement a encore des places disponibles
   * @param event Événement à vérifier
   * @returns true si des places sont disponibles
   */
  hasAvailableSpots(event: Event): boolean {
    return event.participantsCount < event.nombreMaxParticipants;
  }

  /**
   * Vérifie si l'utilisateur est inscrit à un événement
   * @param eventId ID de l'événement
   * @returns true si inscrit
   */
  isUserJoined(eventId: string | undefined): boolean {
    if (!eventId) return false;
    return this.userParticipations.get(eventId) || false;
  }

  /**
   * Formate une date Timestamp Firebase
   * @param timestamp Timestamp Firebase
   * @returns Chaîne formatée
   */
  formatDate(timestamp: any): string {
    if (!timestamp) return 'Date non définie';
    
    const date = timestamp.toDate();
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString('fr-FR', options);
  }

  /**
   * Déconnexion de l'utilisateur
   */
  async logout() {
    const alert = await this.alertController.create({
      header: 'Déconnexion',
      message: 'Voulez-vous vraiment vous déconnecter ?',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Se déconnecter',
          handler: async () => {
            try {
              await signOut(this.auth);
              this.router.navigate(['/login']);
              this.showToast('Déconnexion réussie', 'success');
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
              this.showToast('Erreur lors de la déconnexion', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Affiche une notification toast
   */
  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color
    });
    await toast.present();
  }
}