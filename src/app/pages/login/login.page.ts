import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true, 
  imports: [CommonModule, IonicModule, ReactiveFormsModule] // au lieu d'utiliser un module NgModule on import directement ReactiveFormsModule 
})
export class LoginPage {
  loginForm: FormGroup;

  constructor(private fb: FormBuilder) {
    // la creation du formulaire 
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

 // la methode utilisée pour la connexion 
  onLogin() {
    if (this.loginForm.valid) {
      console.log('✅ Données de connexion :', this.loginForm.value);
    } else {
      console.log('⚠️ Formulaire invalide');
    }
  }
}
