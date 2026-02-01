import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ]
})
export class RegisterComponent {
  nombre = '';
  email = '';
  telefono = '';
  password = '';
  showPassword = false;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private auth: AuthService, private router: Router) { }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  // Registro con Email/Password (Firebase)
  onRegister() {
    this.errorMessage = '';
    this.successMessage = '';

    // Validación del teléfono (Ecuador)
    const telefonoValido = /^(\+593|0)\d{9}$/.test(this.telefono.trim());
    if (!telefonoValido) {
      this.errorMessage = 'Ingrese un número de teléfono válido (Ecuador)';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    this.loading = true;

    this.auth.registerWithEmail(this.nombre, this.email, this.password, this.telefono).subscribe({
      next: () => {
        this.successMessage = '¡Registro exitoso! Redirigiendo...';
        this.errorMessage = '';
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 1000);
      },
      error: (err: string) => {
        this.errorMessage = err;
        this.successMessage = '';
        this.loading = false;
      }
    });
  }

  // Registro con Google
  onGoogleRegister() {
    this.loading = true;
    this.errorMessage = '';

    this.auth.loginWithGoogle().subscribe({
      next: () => {
        this.successMessage = '¡Registro con Google exitoso!';
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 500);
      },
      error: (err: string) => {
        this.errorMessage = err;
        this.loading = false;
      }
    });
  }
}