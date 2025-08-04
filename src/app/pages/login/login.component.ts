import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import jwt_decode from 'jwt-decode'; // ← CORRECTO para jwt-decode v3

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
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onLogin() {
    this.authService.login(this.email, this.password).subscribe({
      next: (res: any) => {
        this.authService.saveToken(res.access_token);

        // Decodifica el token con jwt_decode
        const decoded: any = jwt_decode(res.access_token);
        const role = decoded?.role;
        const nombre = decoded?.nombre;
        const email = decoded?.email;

        // Guarda nombre y email en localStorage si quieres usar después
        if (nombre) {
          localStorage.setItem('nombre', nombre);
        }
        if (email) {
          localStorage.setItem('email', email);
        }

        // Redirección por rol
        if (role === 'admin') {
          this.router.navigate(['/admin-users']);
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: () => {
        this.error = 'Credenciales incorrectas';
      }
    });
  }
}
