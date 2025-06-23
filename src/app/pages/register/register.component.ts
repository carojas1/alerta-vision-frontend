// src/app/pages/register/register.component.ts
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
})
export class RegisterComponent {
  nombre = '';
  email = '';
  password = '';
  confirmPassword = '';
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (this.password !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }
    this.authService.register(this.nombre, this.email, this.password)
      .subscribe({
        next: () => this.router.navigate(['/login']),
        error: () => this.error = 'No se pudo registrar. Intenta con otro correo.'
      });
  }
}
