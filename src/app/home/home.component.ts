import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  userName = '';
  fatigaLevel = 0; // Esta variable sí la usa el HTML "pepa"
  selectedTab = 'home';

  // Para mantener sincronizado el tema con Reports / History
  isDarkMode = true;

  constructor(
    private router: Router,
    private auth: AuthService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit() {
    // 🔥 LEER TEMA GUARDADO Y APLICARLO AL <body>
    if (typeof window !== 'undefined' && localStorage) {
      const savedTheme = localStorage.getItem('theme');

      if (savedTheme === 'light') {
        this.isDarkMode = false;
        this.document.body.classList.add('light-mode');
      } else {
        this.isDarkMode = true;
        this.document.body.classList.remove('light-mode');
      }
    }

    // Lógica que ya tenías
    this.userName = this.auth.userName || 'Usuario';
    // Animación para la barra de fatiga
    setTimeout(() => this.fatigaLevel = 100, 400);
  }

  // --- ¡FUNCIONES "PEPA" PARA LOS BOTONES NUEVOS! ---

  onStartMonitoring() {
    console.log('¡BOTÓN INICIAR MONITORÉO PRESIONADO!');
    // Aquí pondremos la lógica para tu ESP32
    alert('Iniciando monitoreo... (¡Aquí conectas tu ESP32!)');
  }

  onConnectLenses() {
    console.log('¡BOTÓN CONECTAR LENTES PRESIONADO!');
    // Aquí pondremos la lógica de conexión Bluetooth/WiFi
    alert('Buscando lentes... (¡Aquí conectas tu ESP32!)');
  }

  onRetry() {
    console.log('¡BOTÓN REINTENTAR PRESIONADO!');
    alert('Reintentando conexión...');
  }

  // --- FUNCIONES QUE YA TENÍAS ---

  goTo(tab: string) {
    this.selectedTab = tab;

    if (tab === 'history') {
      this.router.navigate(['/history']);
    } else if (tab === 'reports') {
      this.router.navigate(['/reports']);
    } else if (tab === 'home') {
      this.router.navigate(['/home']);
    } else {
      this.router.navigate([`/${tab}`]);
    }
  }

  logout() {
    this.auth.logout?.(); // Llama a tu servicio si existe ese método
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
