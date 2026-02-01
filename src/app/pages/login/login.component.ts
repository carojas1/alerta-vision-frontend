import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
  loading = false;
  showPassword = false;
  isModalOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  openModal(event: Event) {
    event.preventDefault();
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  // Login con Email/Password (Firebase)
  onLogin() {
    if (!this.email || !this.password) {
      this.error = 'Ingresa tu correo y contraseña';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.loginWithEmail(this.email, this.password).subscribe({
      next: (res: any) => {
        this.loading = false;
        console.log('✅ Login exitoso:', res);

        // Verificar rol para redirección
        const role = localStorage.getItem('role') || 'user';

        if (role === 'admin') {
          this.router.navigate(['/admin-users']);
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: (err: string) => {
        this.loading = false;
        this.error = err;
        console.error('❌ Error login:', err);
      }
    });
  }

  // Login con Google
  onGoogleLogin() {
    this.loading = true;
    this.error = '';

    this.authService.loginWithGoogle().subscribe({
      next: (res: any) => {
        this.loading = false;
        console.log('✅ Login con Google exitoso:', res);
        this.router.navigate(['/home']);
      },
      error: (err: string) => {
        this.loading = false;
        this.error = err;
        console.error('❌ Error Google login:', err);
      }
    });
  }
}