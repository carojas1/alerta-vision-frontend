import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import jwt_decode from 'jwt-decode';

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
        // Guarda el token
        this.authService.saveToken(res.access_token);

        // Decodifica el token
        const decoded: any = jwt_decode(res.access_token);

        // Soporta ambos nombres (role o rol)
        const role = decoded?.rol || decoded?.role || '';
        const nombre = decoded?.nombre || '';
        const email = decoded?.email || '';

        // Debug: Mira en consola qué valores tiene el token
        console.log('decoded:', decoded, 'role:', role);

        // Guarda info útil en localStorage
        localStorage.setItem('nombre', nombre);
        localStorage.setItem('email', email);
        localStorage.setItem('role', role);

        // Redirección según rol
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
