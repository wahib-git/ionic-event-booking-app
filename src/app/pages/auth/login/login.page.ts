import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule,FormGroup, FormBuilder, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router'; 
import { AuthService } from 'src/app/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  
  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  async onLogin() {
  const { email, password } = this.loginForm.value;
  try {
    const userCredential = await this.auth.login(email!, password!);
    const uid = userCredential.user.uid;
    const role = await this.auth.getUserRole(uid);

    if (role === 'admin') {
      alert('Bienvenue Admin !');
      this.router.navigate(['/admin-dashboard']);
    } else if (role === 'participant') {
      alert('Bienvenue Participant !');
      this.router.navigate(['/participant-dashboard']);
    } else {
      alert('Rôle inconnu, contactez l’administrateur.');
    }
  } catch (error: any) {
    alert('Erreur : ' + error.message);
  }
}
}