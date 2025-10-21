import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule,FormGroup, FormBuilder, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  
  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  async onLogin() {
    const { email, password } = this.loginForm.value;
    try {
      await this.auth.login(email!, password!);
      alert(' Connexion réussie !');
      this.router.navigate(['/home']); 
    } catch (error: any) {
      alert(' Erreur : ' + error.message);
    }
  }
}
