import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
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
  IonFab,
  IonFabButton,
  IonButtons,
  IonSpinner,
  IonMenuButton,
  AlertController,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  add, 
  trash, 
  calendar, 
  location, 
  people, 
  logOut,
  personCircle 
} from 'ionicons/icons';
import { Auth, signOut } from '@angular/fire/auth';
import { EventService } from 'src/app/services/event.service';
import { Event } from 'src/app/models/models';

/**
 * Page d'accueil pour les administrateurs
 * Affiche tous les événements avec possibilité de:
 * - Créer de nouveaux événements
 * - Supprimer des événements existants
 * - Voir les détails des événements
 * - Se déconnecter
 */
@Component({
  selector: 'app-admin-home',
  templateUrl: './admin-home.page.html',
  styleUrls: ['./admin-home.page.scss'],
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
    IonFab,
    IonFabButton,
    IonButtons,
    IonSpinner
  ]
})
export class AdminHomePage implements OnInit {
  // Liste des événements à afficher
  events: Event[] = [];
  
  // Indicateur de chargement des données
  isLoading = true;

  /**
   * Constructeur avec injection des dépendances
   * @param eventService Service de gestion des événements
   * @param auth Service d'authentification Firebase
   * @param router Router pour la navigation
   * @param alertController Controller pour les dialogues de confirmation
   * @param loadingController Controller pour les indicateurs de chargement
   * @param toastController Controller pour les notifications toast
   */
  constructor(
    private eventService: EventService,
    private auth: Auth,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    // Enregistrement des icônes Ionicons utilisées dans le template
    addIcons({ add, trash, calendar, location, people, logOut, personCircle });
  }

  /**
   * Lifecycle hook: exécuté lors de l'initialisation du composant
   * Charge la liste des événements
   */
  ngOnInit() {
    this.loadEvents();
  }

  /**
   * Charge tous les événements depuis Firebase
   * Souscrit à l'Observable du service pour recevoir les données
   */
  loadEvents() {
    // Affichage de l'indicateur de chargement
    this.isLoading = true;

    // Souscription à l'Observable des événements
    this.eventService.getAllEvents().subscribe({
      next: (events) => {
        // Succès: mise à jour de la liste des événements
        this.events = events;
        this.isLoading = false;
        console.log(`${events.length} événements chargés`);
      },
      error: (error) => {
        // Erreur: affichage d'un message et arrêt du chargement
        console.error('Erreur lors du chargement des événements:', error);
        this.isLoading = false;
        this.showToast('Erreur lors du chargement des événements', 'danger');
      }
    });
  }

  /**
   * Navigation vers la page de création d'événement
   */
  goToCreateEvent() {
    this.router.navigate(['/create-event']);
  }

  /**
   * Supprime un événement après confirmation de l'utilisateur
   * Affiche un dialogue de confirmation avant la suppression
   * 
   * @param event Événement à supprimer
   */
  async deleteEvent(event: Event) {
    // Création du dialogue de confirmation
    const alert = await this.alertController.create({
      header: 'Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer l'événement "${event.nom}" ? Cette action est irréversible.`,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Supprimer',
          role: 'destructive',
          handler: async () => {
            // Confirmation reçue: procéder à la suppression
            await this.performDelete(event);
          }
        }
      ]
    });

    // Affichage du dialogue
    await alert.present();
  }

  /**
   * Effectue la suppression réelle de l'événement
   * Affiche un loader pendant la suppression
   * 
   * @param event Événement à supprimer
   */
  private async performDelete(event: Event) {
    // Affichage du loader
    const loading = await this.loadingController.create({
      message: 'Suppression en cours...'
    });
    await loading.present();

    try {
      // Appel au service pour supprimer l'événement
      await this.eventService.deleteEvent(event.id!);
      
      // Succès: rechargement de la liste et notification
      this.loadEvents();
      await loading.dismiss();
      this.showToast('Événement supprimé avec succès', 'success');
    } catch (error) {
      // Erreur: notification de l'échec
      console.error('Erreur lors de la suppression:', error);
      await loading.dismiss();
      this.showToast('Erreur lors de la suppression de l\'événement', 'danger');
    }
  }

  /**
   * Formate une date Timestamp Firebase en chaîne lisible
   * 
   * @param timestamp Timestamp Firebase
   * @returns Chaîne formatée (ex: "15 janvier 2025 à 14:30")
   */
  formatDate(timestamp: any): string {
    if (!timestamp) return 'Date non définie';
    
    // Conversion du Timestamp Firebase en Date JavaScript
    const date = timestamp.toDate();
    
    // Options de formatage pour un affichage français
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    // Retour de la date formatée en français
    return date.toLocaleDateString('fr-FR', options);
  }

  /**
   * Déconnexion de l'utilisateur
   * Affiche un dialogue de confirmation avant de se déconnecter
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
              // Déconnexion Firebase
              await signOut(this.auth);
              
              // Redirection vers la page de login
              this.router.navigate(['/login']);
              
              // Notification de succès
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
   * 
   * @param message Message à afficher
   * @param color Couleur du toast ('success', 'danger', 'warning', etc.)
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