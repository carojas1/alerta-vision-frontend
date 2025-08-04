import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { Router } from '@angular/router';
import { ReportsService } from '../../services/reports.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
})
export class ReportsComponent {
  activeTab: 'diario' | 'semanal' | 'mensual' = 'diario';
  exportando = false;
  email = ''; // Email del usuario autenticado

  barChartData: any;
  barChartOptions: any;

  mesesCortos = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  semanas = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5', 'Semana 6'];
  diasCortos = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  diaMasSomnoliento = '';
  historialExportaciones = [
    { fecha: '20/07', valor: 85 },
    { fecha: '21/07', valor: 30 },
    { fecha: '22/07', valor: 65 },
    { fecha: '24/07', valor: 50 },
    { fecha: '27/07', valor: 100 }
  ];

  constructor(
    private router: Router,
    private reportsService: ReportsService,
    private authService: AuthService
  ) {
    this.selectTab(this.activeTab);
    // Obtiene el email de forma segura siempre que inicia el componente
    this.email = this.authService.getEmail();
  }

  selectTab(tab: 'diario' | 'semanal' | 'mensual') {
    this.activeTab = tab;

    if (tab === 'diario') {
      this.barChartData = {
        labels: this.diasCortos,
        datasets: [
          { data: [7, 5, 6, 8, 4, 7, 6], label: 'Somnolencia', backgroundColor: '#dec6a1' }
        ]
      };
    } else if (tab === 'semanal') {
      this.barChartData = {
        labels: this.semanas,
        datasets: [
          { data: [41, 36, 33, 38, 44, 29], label: 'Somnolencia', backgroundColor: '#dec6a1' }
        ]
      };
    } else if (tab === 'mensual') {
      this.barChartData = {
        labels: this.mesesCortos,
        datasets: [
          { data: [160, 143, 129, 156, 149, 172, 185, 144, 130, 153, 168, 175], label: 'Somnolencia', backgroundColor: '#dec6a1' }
        ]
      };
    }

    this.barChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: false }
      },
      scales: {
        x: {
          ticks: {
            color: '#3d2b00',
            font: { size: 14, weight: 'bold' }
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#3d2b00',
            font: { size: 14, weight: 'bold' }
          }
        }
      }
    };

    this.setDiaMasSomnoliento();
  }

  setDiaMasSomnoliento() {
    const arr = this.barChartData.datasets[0].data as number[];
    const labels = this.barChartData.labels;
    if (!arr || arr.length === 0) {
      this.diaMasSomnoliento = '-';
      return;
    }
    const maxIdx = arr.indexOf(Math.max(...arr));
    this.diaMasSomnoliento = labels[maxIdx];
  }

  getBarChartAverage() {
    const arr = this.barChartData.datasets[0].data as number[];
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  goTo(ruta: string) {
    this.router.navigate([`/${ruta}`]);
  }

  exportarCorreo() {
    this.exportando = true;
    // ACTUALIZA el email por si el usuario cambió sesión
    this.email = this.authService.getEmail();
    if (!this.email) {
      alert('No se encontró el email del usuario');
      this.exportando = false;
      return;
    }

    this.reportsService.exportarPorCorreo(this.activeTab, this.email).subscribe({
      next: () => {
        alert('¡Reporte enviado a tu correo!');
        this.exportando = false;
        // Actualiza el historial
        const now = new Date();
        const fecha = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth()+1).toString().padStart(2, '0')}`;
        const valor = Math.floor(Math.random()*100)+40;
        if (this.historialExportaciones.length >= 5) this.historialExportaciones.shift();
        this.historialExportaciones.push({ fecha, valor });
      },
      error: () => {
        alert('Error al enviar el reporte. Intenta más tarde.');
        this.exportando = false;
      }
    });
  }
}
