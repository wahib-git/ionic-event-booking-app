import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { AuthService } from '../services/auth';
import { LoadingController, ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private auth: Auth,
    private router: Router,
    private authService: AuthService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  async canActivate(): Promise<boolean> {
    console.log(' AdminGuard - Vérification');

    return new Promise((resolve) => {
      onAuthStateChanged(this.auth, async (user) => {
        console.log(' Utilisateur:', user?.uid || 'null');

        if (!user) {
          console.warn(' Pas d\'utilisateur');
          this.router.navigate(['/login']);
          resolve(false);
          return;
        }

        try {
          const role = await this.authService.getUserRole(user.uid);

          console.log('Rôle:', role);
          if (role === 'admin') {
            console.log(' Admin accepté');
            resolve(true);
          } else {
            console.warn(' Pas admin, rôle:', role);
            this.showToast('Accès refusé. Rôle: ' + role);
            this.router.navigate(['/participant-dashboard']);
            resolve(false);
          }
        } catch (error: any) {
          console.error(' Erreur:', error?.message || error);
          this.showToast('Erreur vérification');
          this.router.navigate(['/login']);
          resolve(false);
        }
      });
    });
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

@Injectable({
  providedIn: 'root'
})
export class ParticipantGuard implements CanActivate {
  constructor(
    private auth: Auth,
    private router: Router,
    private authService: AuthService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  async canActivate(): Promise<boolean> {
    console.log(' ParticipantGuard - Vérification');

    return new Promise((resolve) => {
      onAuthStateChanged(this.auth, async (user) => {
        console.log('👤 Utilisateur:', user?.uid || 'null');

        if (!user) {
          console.warn(' Pas d\'utilisateur');
          this.router.navigate(['/login']);
          resolve(false);
          return;
        }

        try {
          const role = await this.authService.getUserRole(user.uid);

          console.log('Rôle:', role);
          if (role === 'participant') {
            console.log(' Participant accepté');
            resolve(true);
          } else {
            console.warn(' Pas participant, rôle:', role);
            this.showToast('Accès refusé');
            this.router.navigate(['/admin-dashboard']);
            resolve(false);
          }
        } catch (error: any) {
          console.error(' Erreur:', error?.message || error);
          this.showToast('Erreur vérification');
          this.router.navigate(['/login']);
          resolve(false);
        }
      });
    });
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