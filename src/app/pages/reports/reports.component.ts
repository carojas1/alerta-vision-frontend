// src/app/pages/reports/reports.component.ts
import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

import { ReportsService, SeriesResponse } from '../../services/reports.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  activeTab: 'diario' | 'semanal' | 'mensual' = 'diario';
  loading = false;
  errorMsg = '';

  userName = '';
  userEmail = '';
  userId: string | null = null;

  email = '';
  sending = false;
  exportMsg = '';

  isDarkMode = true;
  notificationsEnabled = true;

  promedioDia = 0;
  mejorDia = 0;
  peorDia = 0;

  barData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'Somnolencia', backgroundColor: '#38bdf8' }]
  };
  barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true, max: 100 } }
  };

  lineData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Semana',
        tension: 0.3,
        fill: false,
        borderColor: '#3b82f6',
        pointRadius: 4
      }
    ]
  };
  lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true, max: 100 } }
  };

  donutData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          '#0ea5e9',
          '#22c55e',
          '#eab308',
          '#ef4444',
          '#6366f1'
        ]
      }
    ]
  };
  donutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false
  };

  constructor(
    private reportsService: ReportsService,
    private auth: AuthService,
    private router: Router,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    const user = this.auth.currentUser as any;
    if (user) {
      this.userId = user.id?.toString() ?? null;
      this.userName = user.nombre || 'Usuario';
      this.userEmail = user.email || '';
    }

    if (typeof window !== 'undefined' && localStorage) {
      const theme = localStorage.getItem('theme');
      this.isDarkMode = theme !== 'light';
      if (!this.isDarkMode) {
        this.document.body.classList.add('light-mode');
      }

      const notif = localStorage.getItem('notificationsEnabled');
      this.notificationsEnabled = notif !== '0';
    }

    this.cargarDatos();
  }

  setTab(tab: 'diario' | 'semanal' | 'mensual') {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.cargarDatos();
  }

  private rangoFechas() {
    const hoy = new Date();
    const to = hoy.toISOString().split('T')[0];

    const desde = new Date(hoy);
    if (this.activeTab === 'semanal') desde.setDate(hoy.getDate() - 7);
    if (this.activeTab === 'mensual') desde.setMonth(hoy.getMonth() - 1);

    return { from: desde.toISOString().split('T')[0], to };
  }

  cargarDatos() {
    this.loading = true;
    this.errorMsg = '';

    const { from, to } = this.rangoFechas();
    const id = this.userId || undefined;

    let obs;
    if (this.activeTab === 'diario') {
      obs = this.reportsService.getDaily(from, to, id);
    } else if (this.activeTab === 'semanal') {
      obs = this.reportsService.getWeekly(from, to, id);
    } else {
      obs = this.reportsService.getMonthly(from, to, id);
    }

    obs.subscribe({
      next: (resp: SeriesResponse) => {
        const safeResp: SeriesResponse = resp || { labels: [], values: [] };
        this.actualizarGraficos(safeResp);
        this.actualizarKpis(safeResp);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error reportes:', err);
        this.errorMsg = 'No se pudieron cargar los reportes.';
        this.loading = false;

        // Dejar los gráficos en estado vacío, pero sin romper
        this.actualizarGraficos({ labels: [], values: [] });
        this.actualizarKpis({ labels: [], values: [] });
      }
    });
  }

  private actualizarGraficos(resp: SeriesResponse) {
    const labels = resp.labels || [];
    const values = resp.values || [];

    if (this.activeTab === 'diario') {
      this.barData = {
        labels,
        datasets: [
          { data: values, label: 'Somnolencia', backgroundColor: '#38bdf8' }
        ]
      };
    } else if (this.activeTab === 'semanal') {
      this.lineData = {
        labels,
        datasets: [
          {
            data: values,
            label: 'Semana',
            tension: 0.3,
            fill: false,
            borderColor: '#3b82f6',
            pointRadius: 4
          }
        ]
      };
    } else {
      this.donutData = {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: [
              '#0ea5e9',
              '#22c55e',
              '#eab308',
              '#ef4444',
              '#6366f1'
            ]
          }
        ]
      };
    }
  }

  private actualizarKpis(resp: SeriesResponse) {
    const values = resp.values || [];
    if (!values.length) {
      this.promedioDia = this.mejorDia = this.peorDia = 0;
      return;
    }
    const sum = values.reduce((a, b) => a + b, 0);
    this.promedioDia = Number((sum / values.length).toFixed(1));
    this.mejorDia = Math.max(...values);
    this.peorDia = Math.min(...values);
  }

  exportarCorreoUsuario(): void {
    if (!this.userEmail) {
      this.exportMsg = 'No se encontró correo del usuario.';
      return;
    }
    this.enviarReporte(this.userEmail);
  }

  exportarCorreoManual(): void {
    if (!this.email) {
      this.exportMsg = 'Ingresa un correo válido.';
      return;
    }
    this.enviarReporte(this.email);
  }

  private enviarReporte(email: string) {
    this.sending = true;
    this.exportMsg = '';

    // 👇 Mapeo tabs ES → EN para el backend
    const tabBackend =
      this.activeTab === 'diario'
        ? 'daily'
        : this.activeTab === 'semanal'
        ? 'weekly'
        : 'monthly';

    this.reportsService.exportarPorCorreo(tabBackend, email).subscribe({
      next: (res) => {
        this.exportMsg = res.message || 'Reporte enviado correctamente.';
        this.sending = false;
      },
      error: (err) => {
        console.error(err);
        this.exportMsg = 'No se pudo enviar el reporte.';
        this.sending = false;
      }
    });
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      this.document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      this.document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    }
  }

  toggleNotifications() {
    this.notificationsEnabled = !this.notificationsEnabled;
    localStorage.setItem(
      'notificationsEnabled',
      this.notificationsEnabled ? '1' : '0'
    );
  }

  goTo(tab: string) {
    this.router.navigate(['/' + tab]);
  }
}
