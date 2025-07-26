import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { Router } from '@angular/router';
import { ReportsService } from '../../services/reports.service';

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

  barChartData: any;
  barChartOptions: any;

  mesesCortos = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  semanas = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5', 'Semana 6'];

  constructor(
    private router: Router,
    private reportsService: ReportsService
  ) {
    this.selectTab(this.activeTab); // Carga los datos iniciales
  }

  selectTab(tab: 'diario' | 'semanal' | 'mensual') {
    this.activeTab = tab;

    if (tab === 'diario') {
      this.barChartData = {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
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
    this.reportsService.exportarPorCorreo(this.activeTab).subscribe({
      next: () => {
        alert('¡Reporte enviado a tu correo!');
        this.exportando = false;
      },
      error: () => {
        alert('Error al enviar el reporte. Intenta más tarde.');
        this.exportando = false;
      }
    });
  }
}
