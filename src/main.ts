/* import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore, enableIndexedDbPersistence } from '@angular/fire/firestore';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),

    // Router Angular/Ionic avec préchargement
    provideRouter(routes, withPreloading(PreloadAllModules)),

    // Initialisation Firebase App
    provideFirebaseApp(() => initializeApp(environment.firebase)),

    // Initialisation Firebase Auth
    provideAuth(() => getAuth()),

    // Initialisation Firebase Firestore avec persistance
    provideFirestore(() => {
      const firestore = getFirestore();
      
      // Activer la persistance offline
      enableIndexedDbPersistence(firestore).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Firestore: Plusieurs onglets ouverts, persistance désactivée');
        } else if (err.code === 'unimplemented') {
          console.warn('Firestore: Navigateur ne supporte pas la persistance');
        }
      });

      return firestore;
    }),
  ],
}); */
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),

    // Router Angular/Ionic avec préchargement
    provideRouter(routes, withPreloading(PreloadAllModules)),

    // Initialisation Firebase App
    provideFirebaseApp(() => initializeApp(environment.firebase)),

    // Initialisation Firebase Auth
    provideAuth(() => getAuth()),

    // Initialisation Firebase Firestore SANS persistance IndexedDB
    // (La persistance cause des erreurs dans certains environnements)
    provideFirestore(() => getFirestore()),
  ],
});