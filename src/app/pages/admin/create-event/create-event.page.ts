import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Firestore, collection, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { ToastController, IonicModule } from '@ionic/angular';
import { IonHeader } from "@ionic/angular/standalone";

@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.page.html',
  styleUrls: ['./create-event.page.scss'],
  imports: [IonHeader, IonicModule, ReactiveFormsModule],
})
export class CreateEventPage {
  eventForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private auth: Auth,
    private toastController: ToastController,
    private router: Router
  ) {
    this.eventForm = this.fb.group({
      nom: ['', Validators.required],
      description: ['', Validators.required],
      dateDebut: ['', Validators.required],
      lieu: ['', Validators.required],
      nombreMaxParticipants: [0, [Validators.required, Validators.min(1)]],
      imageUrl: ['']
    });
  }

  async submitEvent() {
    if (!this.eventForm.valid) return;

    try {
      const user = this.auth.currentUser;
      if (!user) throw new Error('Utilisateur non connecté');

      const eventsRef = collection(this.firestore, 'events');
      await addDoc(eventsRef, {
        ...this.eventForm.value,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        participantsCount: 0
      });

      this.showToast('Événement créé avec succès !');
      this.router.navigate(['/admin-home']);
    } catch (error: any) {
      console.error(error);
      this.showToast('Erreur lors de la création de l\'événement');
    }
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }
}
