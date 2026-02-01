import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { environment } from '../enviromets/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  // Usuario
  userName = '';
  userEmail = '';
  userId = '';

  // Estado de monitoreo
  fatigaLevel = 0;
  selectedTab = 'home';
  isDarkMode = true;

  // Perfil
  showProfileModal = false;
  editData: any = { nombre: '', telefono: '', email_recuperacion: '' };

  // Estado de lentes
  conectandoLentes = false;
  lentesConectados = false;
  errorConexionLentes = '';

  // Batería
  showBatteryModal = false;
  batteryLevel = 100;
  batteryLoading = false;
  batteryError = '';
  lastBatteryUpdate = '';

  // Alarma
  alarmaActiva = false;

  // Estadísticas
  alertasHoy = 0;
  tiempoConduccion = '0h 0m';

  // Polling
  private statusInterval$?: Subscription;

  private backendBase = environment.apiUrl;

  constructor(
    private router: Router,
    private auth: AuthService,
    private http: HttpClient,
    @Inject(DOCUMENT) private document: Document,
  ) { }

  ngOnInit() {
    if (typeof window !== 'undefined' && localStorage) {
      // Tema
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light') {
        this.isDarkMode = false;
        this.document.body.classList.add('light-mode');
      } else {
        this.isDarkMode = true;
        this.document.body.classList.remove('light-mode');
      }

      // Datos del usuario
      this.userName = localStorage.getItem('userName') || 'Usuario';
      this.userEmail = localStorage.getItem('userEmail') || 'usuario@app.com';
      this.userId = localStorage.getItem('userId') || '';
    }

    // Animación de la barra
    setTimeout(() => (this.fatigaLevel = 100), 400);

    // Iniciar polling del estado de los lentes cada 5 segundos
    this.startStatusPolling();

    // Cargar alertas de hoy
    this.loadTodayAlerts();
  }

  ngOnDestroy() {
    this.statusInterval$?.unsubscribe();
  }

  // ======== POLLING ESTADO LENTES ========
  private startStatusPolling() {
    // Consultar estado cada 5 segundos
    this.statusInterval$ = interval(5000).subscribe(() => {
      this.fetchLensStatus();
    });

    // Primera consulta inmediata
    this.fetchLensStatus();
  }

  private fetchLensStatus() {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.http.get<any>(`${this.backendBase}/lentes/status`).subscribe({
      next: (res) => {
        console.log('📡 Estado lentes:', res);
        this.lentesConectados = res.conectados ?? false;
        this.batteryLevel = res.bateria ?? 100;
        this.alarmaActiva = res.alarmaActiva ?? false;
        this.lastBatteryUpdate = new Date().toLocaleTimeString();

        // Alerta de batería baja
        if (this.batteryLevel <= 5 && this.lentesConectados) {
          this.showLowBatteryAlert();
        }
      },
      error: (err) => {
        // Si no existe el endpoint, simular datos
        console.log('⚠️ Endpoint /lentes/status no disponible, usando datos simulados');
        // No cambiar el estado para no perder conexión simulada
      }
    });
  }

  private showLowBatteryAlert() {
    // Reproducir sonido de alerta (si el navegador lo permite)
    try {
      const audio = new Audio('/assets/sounds/low-battery.mp3');
      audio.play().catch(() => { });
    } catch (e) { }
  }

  // ======== BATERÍA ========
  onLogoClick() {
    this.showBatteryModal = true;
    this.batteryLoading = false;
    this.batteryError = '';
    this.fetchBatteryLevel();
  }

  closeBatteryModal() {
    this.showBatteryModal = false;
  }

  fetchBatteryLevel() {
    this.batteryLoading = true;

    this.http.get<any>(`${this.backendBase}/lentes/status`).subscribe({
      next: (res) => {
        this.batteryLevel = res.bateria ?? this.batteryLevel;
        this.lentesConectados = res.conectados ?? this.lentesConectados;
        this.lastBatteryUpdate = new Date().toLocaleTimeString();
        this.batteryLoading = false;
      },
      error: () => {
        // Simular si no hay endpoint
        this.lastBatteryUpdate = new Date().toLocaleTimeString();
        this.batteryLoading = false;
      }
    });
  }

  getBatteryColor(): string {
    if (this.batteryLevel > 50) return '#22c55e';
    if (this.batteryLevel > 20) return '#eab308';
    if (this.batteryLevel > 5) return '#f97316';
    return '#ef4444';
  }

  getBatteryIcon(): string {
    if (this.batteryLevel > 75) return '🔋';
    if (this.batteryLevel > 50) return '🔋';
    if (this.batteryLevel > 25) return '🪫';
    if (this.batteryLevel > 5) return '🪫';
    return '⚠️';
  }

  // ======== SILENCIAR ALARMA ========
  silenciarAlarma() {
    this.http.post(`${this.backendBase}/lentes/silence`, {}).subscribe({
      next: () => {
        this.alarmaActiva = false;
        console.log('✅ Alarma silenciada');
      },
      error: () => {
        // Simular
        this.alarmaActiva = false;
        console.log('✅ Alarma silenciada (simulado)');
      }
    });
  }

  // ======== PERFIL ========
  toggleProfile() {
    this.showProfileModal = !this.showProfileModal;
    if (this.showProfileModal) {
      this.editData.nombre = this.userName;
      this.editData.telefono = localStorage.getItem('userPhone') || '';
      this.editData.email_recuperacion = localStorage.getItem('userRecovery') || '';
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

  // ======== CONEXIÓN LENTES ========
  onConnectLenses() {
    this.errorConexionLentes = '';
    this.conectandoLentes = true;

    const token = localStorage.getItem('token');
    if (!token) {
      this.conectandoLentes = false;
      this.errorConexionLentes = 'Debes iniciar sesión primero.';
      return;
    }

    // Verificar conexión con backend
    this.http.get(`${this.backendBase}/users/me`).subscribe({
      next: (res: any) => {
        console.log('✅ Conexión backend OK');
        this.conectandoLentes = false;
        this.lentesConectados = true;
        this.errorConexionLentes = '';

        // Obtener estado de batería
        this.fetchBatteryLevel();
      },
      error: (err) => {
        console.error('❌ Error conectando:', err);
        this.conectandoLentes = false;
        this.lentesConectados = false;
        this.errorConexionLentes = 'No se pudo conectar. Verifica tu conexión.';
      },
    });
  }

  // ======== ESTADÍSTICAS ========
  private loadTodayAlerts() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const today = new Date().toISOString().split('T')[0];

    this.http.get<any[]>(`${this.backendBase}/alerts?from=${today}&to=${today}`).subscribe({
      next: (alerts) => {
        this.alertasHoy = alerts?.length || 0;
      },
      error: () => {
        this.alertasHoy = 0;
      }
    });
  }

  // ======== NAVEGACIÓN ========
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
