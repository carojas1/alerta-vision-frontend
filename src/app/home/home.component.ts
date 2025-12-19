import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';

import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  userName = '';
  userEmail = '';
  fatigaLevel = 0;
  selectedTab = 'home';
  isDarkMode = true;

  showProfileModal = false;
  editData: any = { nombre: '', telefono: '', email_recuperacion: '' };

  // 🔌 Estado de los lentes
  conectandoLentes = false;
  lentesConectados = false;
  errorConexionLentes = '';

  // URL base de tu backend en Render
  private backendBase = 'https://alerta-vision-backend.onrender.com';

  constructor(
    private router: Router,
    private auth: AuthService,
    private http: HttpClient,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  ngOnInit() {
    if (typeof window !== 'undefined' && localStorage) {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light') {
        this.isDarkMode = false;
        this.document.body.classList.add('light-mode');
      } else {
        this.isDarkMode = true;
        this.document.body.classList.remove('light-mode');
      }

      this.userName = localStorage.getItem('userName') || 'Usuario';
      this.userEmail = localStorage.getItem('userEmail') || 'usuario@app.com';
    }

    // Animación barra de “Detectando fatigas”
    setTimeout(() => (this.fatigaLevel = 100), 400);
  }

  // -------- PERFIL --------
  toggleProfile() {
    this.showProfileModal = !this.showProfileModal;
    if (this.showProfileModal) {
      this.editData.nombre = this.userName;
      this.editData.telefono = localStorage.getItem('userPhone') || '';
      this.editData.email_recuperacion =
        localStorage.getItem('userRecovery') || '';
    }
  }

  saveProfile() {
    localStorage.setItem('userName', this.editData.nombre);
    localStorage.setItem('userPhone', this.editData.telefono);
    localStorage.setItem('userRecovery', this.editData.email_recuperacion);
    this.userName = this.editData.nombre;
    this.toggleProfile();
    alert('¡Datos guardados!');
  }

  // -------- LENTES / MONITOREO --------
  onStartMonitoring() {
    if (!this.lentesConectados) {
      alert('Primero conecta tus lentes para iniciar el monitoreo.');
      return;
    }

    // Aquí más adelante podrás arrancar lógica real de monitoreo
    alert('Monitoreo iniciado con los lentes conectados.');
  }

  onConnectLenses() {
    this.errorConexionLentes = '';
    this.conectandoLentes = true;

    const token = typeof window !== 'undefined'
      ? localStorage.getItem('token')
      : null;

    if (!token) {
      this.conectandoLentes = false;
      this.lentesConectados = false;
      this.errorConexionLentes = 'Debes iniciar sesión primero.';
      alert('Debes iniciar sesión primero.');
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    // Ping sencillo al backend para validar token y usuario
    this.http.get(`${this.backendBase}/users/me`, { headers }).subscribe({
      next: (res: any) => {
        console.log('✅ Conexión backend OK, usuario:', res);
        this.conectandoLentes = false;
        this.lentesConectados = true;
        this.errorConexionLentes = '';
        alert('Lentes vinculados correctamente al usuario (vía backend).');
      },
      error: (err) => {
        console.error('❌ Error conectando lentes:', err);
        this.conectandoLentes = false;
        this.lentesConectados = false;
        this.errorConexionLentes =
          'No se pudo conectar con el backend. Revisa tu conexión.';
        alert('No se pudo conectar. Revisa internet o el backend.');
      },
    });
  }

  onRetry() {
    this.onConnectLenses();
  }

  // -------- NAVEGACIÓN / SESIÓN --------
  goTo(tab: string) {
    this.selectedTab = tab;
    this.router.navigate([`/${tab}`]);
  }

  logout() {
    this.auth.logout?.();
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
