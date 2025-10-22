/**
 * Modèle représentant un utilisateur dans l'application
 * Utilisé pour typer les données utilisateur provenant de Firebase
 */
export interface User {
  // Identifiant unique de l'utilisateur (généré par Firebase Auth)
  uid: string;
  email: string;
  role: 'admin' | 'participant';
  displayName?: string;
  createdAt: any; // Firebase Timestamp
}

/**
 * Modèle représentant un événement communautaire
 * Créé et géré par les administrateurs
 */
export interface Event {
  id?: string;
  nom: string;
  description: string;
  dateDebut: any; 
  lieu: string;
  nombreMaxParticipants: number;
  imageUrl: string;
  createdBy: string;
  createdAt: any; 
  participantsCount: number;
}

/**
 * Modèle représentant une participation d'un utilisateur à un événement
 * Utilisé pour gérer les inscriptions
 */
export interface Participation {
  eventId: string;
  
  userId: string;
  
  joinedAt: any; 
}

/**
 * Modèle pour les données de création d'un nouvel événement
 * Utilisé dans les formulaires de création (sans les champs auto-générés)
 */
export interface EventCreateDto {
  nom: string;
  description: string;
  dateDebut: string; 
  lieu: string;
  nombreMaxParticipants: number;
  imageUrl: string;
}