import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, signOut } from '@angular/fire/auth';
import { EventService } from 'src/app/services/event.service';
import { Event, EventCreateDto } from 'src/app/models/models';
import {
  IonHeader,
  IonToolbar,
  IonChip,
  IonTitle,
  IonContent,
  IonButton,
  IonLabel,
  IonButtons,
  IonIcon,
  IonSpinner,
  IonCardHeader,
  LoadingController,
  ToastController,
  IonCard,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonBadge,
  IonItem,
  IonBackButton,
  IonDatetimeButton,
  IonModal,
  IonDatetime,
  IonInput,
  IonTextarea,
} from '@ionic/angular/standalone';

/**
 * Page de création d'un nouvel événement
 * Accessible uniquement aux administrateurs
 * Permet de créer un événement avec tous les détails nécessaires
 */
@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.page.html',
  styleUrls: ['./create-event.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonChip,
    IonTitle,
    IonContent,
    IonButton,
    IonLabel,
    IonButtons,
    IonIcon,
    IonSpinner,
    IonCardHeader,
    IonCard,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonBadge,
    IonItem,
    IonBackButton,
    IonDatetimeButton,
    IonModal,
    IonDatetime,
    IonInput,
    IonTextarea,
  ],
})
export class CreateEventPage implements OnInit {
  // Formulaire réactif pour la création d'événement
  eventForm: FormGroup;

  // Date minimale pour le sélecteur (aujourd'hui)
  minDate = new Date().toISOString();
  isLoading = false;

  // Liste des événements chargés
  events: Event[] = [];

  // Ensemble local des événements auxquels l'utilisateur est inscrit (prototype)
  joinedEventIds = new Set<string>();

  /**
   * Constructeur avec injection des dépendances
   * @param fb FormBuilder pour créer le formulaire réactif
   * @param eventService Service de gestion des événements
   * @param auth Service d'authentification Firebase
   * @param router Router pour la navigation
   * @param loadingController Controller pour les indicateurs de chargement
   * @param toastController Controller pour les notifications toast
   */
  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private auth: Auth,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    // Initialisation du formulaire avec validations
    this.eventForm = this.fb.group({
      // Nom de l'événement: obligatoire, min 3 caractères
      nom: ['', [Validators.required, Validators.minLength(3)]],

      // Description: obligatoire, min 10 caractères
      description: ['', [Validators.required, Validators.minLength(10)]],

      // Date de début: obligatoire
      dateDebut: [null, Validators.required],

      // Lieu: obligatoire
      lieu: ['', Validators.required],

      // Nombre maximum de participants: obligatoire, minimum 1
      nombreMaxParticipants: [null, [Validators.required, Validators.min(1)]],

      // URL de l'image: obligatoire, format URL valide
      imageUrl: [
        '',
        [Validators.required, Validators.pattern(/^https?:\/\/.+/)],
      ],
    });
  }

  // Lifecycle: charger les événements au démarrage
  ngOnInit(): void {
    this.loadEvents();
  }

  /**
   * Soumet le formulaire et crée l'événement
   * Vérifie la validité du formulaire avant la soumission
   */
  async onSubmit() {
    // Vérification de la validité du formulaire
    if (this.eventForm.invalid) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.eventForm.controls).forEach((key) => {
        this.eventForm.get(key)?.markAsTouched();
      });

      // Notification d'erreur
      this.showToast(
        'Veuillez remplir tous les champs correctement',
        'warning'
      );
      return;
    }

    // Affichage du loader pendant la création
    const loading = await this.loadingController.create({
      message: "Création de l'événement...",
    });
    await loading.present();

    try {
      // Récupération de l'utilisateur actuel
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }

      // Préparation des données de l'événement
      const eventData: EventCreateDto = this.eventForm.value;

      // Appel au service pour créer l'événement
      const eventId = await this.eventService.createEvent(
        eventData,
        currentUser.uid
      );

      // Succès: fermeture du loader et notification
      await loading.dismiss();
      this.showToast('Événement créé avec succès !', 'success');

      // Redirection vers la page admin home
      this.router.navigate(['/admin-home']);

      console.log('Événement créé avec ID:', eventId);
    } catch (error) {
      // Erreur: fermeture du loader et notification
      console.error("Erreur lors de la création de l'événement:", error);
      await loading.dismiss();
      this.showToast("Erreur lors de la création de l'événement", 'danger');
    }
  }

  /**
   * Annule la création et retourne à la page admin home
   */
  cancel() {
    this.router.navigate(['/admin-home']);
  }

  /**
   * Vérifie si un champ du formulaire est invalide et touché
   * Utilisé pour afficher les messages d'erreur
   *
   * @param fieldName Nom du champ à vérifier
   * @returns true si le champ est invalide et touché
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.eventForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Récupère le message d'erreur pour un champ spécifique
   *
   * @param fieldName Nom du champ
   * @returns Message d'erreur approprié
   */
  getErrorMessage(fieldName: string): string {
    const field = this.eventForm.get(fieldName);

    if (!field || !field.errors) {
      return '';
    }

    // Messages d'erreur selon le type d'erreur
    if (field.errors['required']) {
      return 'Ce champ est obligatoire';
    }

    if (field.errors['minlength']) {
      const minLength = field.errors['minlength'].requiredLength;
      return `Minimum ${minLength} caractères requis`;
    }

    if (field.errors['min']) {
      return 'La valeur doit être au moins 1';
    }

    if (field.errors['pattern']) {
      return "Format d'URL invalide (doit commencer par http:// ou https://)";
    }

    return 'Champ invalide';
  }

  /**
   * Affiche une notification toast
   *
   * @param message Message à afficher
   * @param color Couleur du toast
   */
  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
    });
    await toast.present();
  }

  // Charge les événements depuis Firestore (via EventService)
  private loadEvents() {
    this.isLoading = true;
    this.eventService.getAllEvents().subscribe({
      next: (events) => {
        this.events = events;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement événements', err);
        this.isLoading = false;
        this.showToast('Erreur chargement événements', 'danger');
      },
    });
  }

  // Déconnexion
  async logout() {
    try {
      await signOut(this.auth);
      this.router.navigate(['/login']);
    } catch (err) {
      console.error('Logout error', err);
      this.showToast('Erreur lors de la déconnexion', 'danger');
    }
  }

  // Vérifie si l'utilisateur localement est inscrit à l'événement (prototype)
  isUserJoined(eventId?: string): boolean {
    if (!eventId) return false;
    return this.joinedEventIds.has(eventId);
  }

  // Vérifie s'il reste des places pour l'événement
  hasAvailableSpots(event: Event): boolean {
    return (event.participantsCount ?? 0) < (event.nombreMaxParticipants ?? 0);
  }

  // Formate une date (supporte Firebase Timestamp et string)
  formatDate(date: any): string {
    if (!date) return '';
    try {
      // firebase Timestamp
      if (typeof date.toDate === 'function') {
        return new Date(date.toDate()).toLocaleString();
      }
      // seconds object
      if (date.seconds) {
        return new Date(date.seconds * 1000).toLocaleString();
      }
      return new Date(date).toLocaleString();
    } catch {
      return String(date);
    }
  }

  // Gère l'inscription/désinscription (prototype uniquement, pas sécurisé)
  async toggleParticipation(event: Event) {
    if (!event.id) {
      this.showToast('Événement invalide', 'warning');
      return;
    }

    try {
      if (this.isUserJoined(event.id)) {
        await this.eventService.decrementParticipantsCount(event.id);
        this.joinedEventIds.delete(event.id);
        // Mettre à jour l'affichage local
        event.participantsCount = Math.max(
          0,
          (event.participantsCount ?? 0) - 1
        );
        this.showToast('Désinscription réussie', 'success');
      } else {
        if (!this.hasAvailableSpots(event)) {
          this.showToast('Événement complet', 'warning');
          return;
        }
        await this.eventService.incrementParticipantsCount(event.id);
        this.joinedEventIds.add(event.id);
        event.participantsCount = (event.participantsCount ?? 0) + 1;
        this.showToast('Inscription réussie', 'success');
      }
    } catch (err) {
      console.error('toggleParticipation error', err);
      this.showToast("Erreur lors de l'opération", 'danger');
    }
  }
}
