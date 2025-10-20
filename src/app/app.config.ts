import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { routes } from './app.routes';

//  Configuration Firebase apres que j'ai cree mon projet sur Firebase

const firebaseConfig = {
  apiKey: "AIzaSyA9GxGL8urTlHGGRuIyihRnlOVfwJ2FcaU",
  authDomain: "ionic-event-booking.firebaseapp.com",
  projectId: "ionic-event-booking",
  storageBucket: "ionic-event-booking.appspot.com", 
  messagingSenderId: "1051121128369",
  appId: "1:1051121128369:web:98be33867c511104086390",
  measurementId: "G-KSCS6DWELC"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore())
  ],
};
