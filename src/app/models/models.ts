/**
 * Modèle représentant un utilisateur dans l'application
 * Utilisé pour typer les données utilisateur provenant de Firebase
 */
export interface User {
  // Identifiant unique de l'utilisateur (généré par Firebase Auth)
  uid: string;
  
  // Adresse email de l'utilisateur
  email: string;
  
  // Rôle de l'utilisateur : 'admin' peut gérer les événements, 'participant' peut s'inscrire
  role: 'admin' | 'participant';
  
  // Nom d'affichage de l'utilisateur (optionnel)
  displayName?: string;
  
  // Date de création du compte (timestamp Firebase)
  createdAt: any; // Firebase Timestamp
}

/**
 * Modèle représentant un événement communautaire
 * Créé et géré par les administrateurs
 */
export interface Event {
  // Identifiant unique de l'événement (généré par Firebase)
  id?: string;
  
  // Nom/titre de l'événement
  nom: string;
  
  // Description détaillée de l'événement
  description: string;
  
  // Date et heure de début de l'événement (timestamp Firebase)
  dateDebut: any; // Firebase Timestamp
  
  // Lieu où se déroulera l'événement
  lieu: string;
  
  // Nombre maximum de participants autorisés
  nombreMaxParticipants: number;
  
  // URL de l'image illustrant l'événement
  imageUrl: string;
  
  // ID de l'administrateur qui a créé l'événement
  createdBy: string;
  
  // Date de création de l'événement (timestamp Firebase)
  createdAt: any; // Firebase Timestamp
  
  // Nombre actuel de participants inscrits à l'événement
  participantsCount: number;
}

/**
 * Modèle représentant une participation d'un utilisateur à un événement
 * Utilisé pour gérer les inscriptions
 */
export interface Participation {
  // Identifiant de l'événement
  eventId: string;
  
  // Identifiant de l'utilisateur participant
  userId: string;
  
  // Date d'inscription à l'événement (timestamp Firebase)
  joinedAt: any; // Firebase Timestamp
}

/**
 * Modèle pour les données de création d'un nouvel événement
 * Utilisé dans les formulaires de création (sans les champs auto-générés)
 */
export interface EventCreateDto {
  nom: string;
  description: string;
  dateDebut: string; // Format ISO pour les formulaires
  lieu: string;
  nombreMaxParticipants: number;
  imageUrl: string;
}