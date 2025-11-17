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
  isModalOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

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

  onLogin() {
    this.authService.login(this.email, this.password).subscribe({
      next: (res: any) => {
        this.authService.saveToken(res.access_token);
        const decoded: any = jwt_decode(res.access_token);
        const role = decoded?.rol || decoded?.role || '';
        const nombre = decoded?.nombre || '';
        const email = decoded?.email || '';
        
        // --- Lógica de WhatsApp ---
        const telefono = decoded?.telefono || ''; 
        console.log('Token decodificado:', decoded); 
        localStorage.setItem('nombre', nombre);
        localStorage.setItem('email', email);
        localStorage.setItem('role', role);
        localStorage.setItem('telefono', telefono); // ¡Guardamos el teléfono!
        // --- FIN ---

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