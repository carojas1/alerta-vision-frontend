import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';

import { AuthService } from '../services/auth.service';
import { environment } from '../enviromets/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
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

  // 🔋 Batería de los lentes
  showBatteryModal = false;
  batteryLevel = 0;
  batteryLoading = false;
  batteryError = '';
  lastBatteryUpdate = '';

  // URL base del backend
  private backendBase = environment.apiUrl;

  // Polling interval
  private statusInterval: any = null;

  constructor(
    private router: Router,
    private auth: AuthService,
    private http: HttpClient,
    @Inject(DOCUMENT) private document: Document,
  ) { }

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

    // Animación barra de "Detectando fatigas"
    setTimeout(() => (this.fatigaLevel = 100), 400);

    // Iniciar polling del status de lentes
    this.startStatusPolling();
  }

  ngOnDestroy() {
    this.stopStatusPolling();
  }

  // -------- POLLING STATUS LENTES --------
  startStatusPolling() {
    // Consultar cada 15 segundos
    this.statusInterval = setInterval(() => {
      this.fetchLensStatus();
    }, 15000);

    // Primera consulta inmediata
    this.fetchLensStatus();
  }

  stopStatusPolling() {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
      this.statusInterval = null;
    }
  }

  fetchLensStatus() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.http.get(`${this.backendBase}/lentes/status`, { headers }).subscribe({
      next: (res: any) => {
        if (res) {
          this.batteryLevel = res.bateria || 0;
          this.lentesConectados = res.conectado || false;
          this.lastBatteryUpdate = new Date().toLocaleTimeString();
          console.log('📊 Status lentes:', res);
        }
      },
      error: (err) => {
        // Silencioso si falla (el endpoint puede no existir aún)
        console.log('Status lentes no disponible');
      }
    });
  }

  // -------- BATERÍA --------
  onLogoClick() {
    this.showBatteryModal = true;
    this.batteryLoading = true;
    this.batteryError = '';
    this.fetchBatteryLevel();
  }

  closeBatteryModal() {
    this.showBatteryModal = false;
  }

  fetchBatteryLevel() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.batteryLoading = false;
      this.batteryError = 'No hay sesión activa';
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.http.get(`${this.backendBase}/lentes/status`, { headers }).subscribe({
      next: (res: any) => {
        this.batteryLoading = false;
        if (res && res.bateria !== undefined) {
          this.batteryLevel = res.bateria;
          this.lentesConectados = res.conectado || false;
          this.lastBatteryUpdate = new Date().toLocaleTimeString();
        } else {
          this.batteryError = 'No hay datos de batería disponibles';
        }
      },
      error: (err) => {
        this.batteryLoading = false;
        this.batteryError = 'No se pudo obtener el estado de los lentes';
        console.error('Error obteniendo batería:', err);
      }
    });
  }

  getBatteryColor(): string {
    if (this.batteryLevel > 50) return '#22c55e'; // Verde
    if (this.batteryLevel > 20) return '#eab308'; // Amarillo
    return '#ef4444'; // Rojo
  }

  getBatteryIcon(): string {
    if (this.batteryLevel > 75) return '🔋';
    if (this.batteryLevel > 50) return '🔋';
    if (this.batteryLevel > 25) return '🪫';
    return '🪫';
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

    this.http.get(`${this.backendBase}/users/me`, { headers }).subscribe({
      next: (res: any) => {
        console.log('✅ Conexión backend OK, usuario:', res);
        this.conectandoLentes = false;
        this.lentesConectados = true;
        this.errorConexionLentes = '';
        alert('Lentes vinculados correctamente al usuario.');
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
    this.stopStatusPolling();
    this.auth.logout?.();
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
