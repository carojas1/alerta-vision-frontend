import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  userName = '';
  fatigaLevel = 0;
  despiertoLevel = 0;
  somnolientoLevel = 0;
  selectedTab = 'home';

  constructor(
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.userName = this.auth.userName || 'Usuario';
    setTimeout(() => this.fatigaLevel = 85, 400);
    setTimeout(() => this.despiertoLevel = 60, 800);
    setTimeout(() => this.somnolientoLevel = 42, 1200);
  }

  goTo(tab: string) {
    this.selectedTab = tab;
    if (tab === 'alertas' || tab === 'history') {
      this.router.navigate(['/history']);  // ruta para Alertas
    } else if (tab === 'reportes' || tab === 'reports') {
      this.router.navigate(['/reports']);  // ruta para Reportes
    } else if (tab === 'home') {
      this.router.navigate(['/home']);
    } else {
      this.router.navigate([`/${tab}`]);
    }
  }

  logout() {
    this.auth.logout?.(); // Llama a tu servicio si existe ese método, si no, igual limpia el storage.
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
