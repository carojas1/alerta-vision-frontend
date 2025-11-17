import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { RouterModule } from '@angular/router'; // <-- MIRA AQUÍ (Agregué esta línea)

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule // <-- MIRA AQUÍ (Agregué esto a la lista)
  ]
})
export class RegisterComponent {
  nombre = '';
  email = '';
  telefono = ''; // <-- Nuevo campo
  password = '';
  showPassword = false;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private auth: AuthService, private router: Router) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onRegister() {
    this.errorMessage = '';
    this.successMessage = '';

    // Validación rápida del teléfono (ejemplo Ecuador)
    const telefonoValido = /^(\+593|0)\d{9}$/.test(this.telefono.trim());
    if (!telefonoValido) {
      this.errorMessage = 'Ingrese un número de teléfono válido (Ecuador)';
      return;
    }

    this.loading = true;
    this.auth.register(this.nombre, this.email, this.password, this.telefono).subscribe({
      next: () => {
        this.successMessage = 'Registro exitoso. ¡Ya puedes iniciar sesión!';
        this.errorMessage = '';
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1000);
      },
      error: () => {
        this.errorMessage = 'No se pudo registrar el usuario.';
        this.successMessage = '';
        this.loading = false;
      }
    });
  }
}