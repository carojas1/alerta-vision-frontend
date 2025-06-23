import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service'; // ← CORREGIDO

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    this.authService.login(this.email, this.password).subscribe({
      next: (res: any) => { // ← Ponle tipo 'any' aquí si quieres quitar el warning
        this.authService.saveToken(res.access_token);
        this.router.navigate(['/profile']);
      },
      error: () => {
        this.error = 'Credenciales incorrectas';
      }
    });
  }
}
