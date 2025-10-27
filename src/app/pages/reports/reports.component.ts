import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartOptions } from 'chart.js';
import { ReportsService } from '../../services/reports.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
})
export class ReportsComponent implements OnInit {
  activeTab: 'diario' | 'semanal' | 'mensual' = 'diario';

  from!: string; to!: string; userId?: string;

  loading = false;
  errorMsg = '';
  sending = false;
  exportMsg = '';
  email = '';

  promedioDia = 0; mejorDia = 0; peorDia = 0;

  barLabels: string[] = [];
  barData: any[] = [{ data: [], label: 'Somnolencia', backgroundColor: '#E5B27F', borderRadius: 8, barThickness: 24 }];
  barOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { stepSize: 2 }, grid: { color: 'rgba(0,0,0,0.06)' } }
    }
  };

  lineLabels: string[] = [];
  lineData: any[] = [{ data: [], label: 'Somnolencia semanal', fill: 'origin', borderColor: '#D2995A', backgroundColor: 'rgba(226,174,120,.22)', tension: 0.35, pointRadius: 3 }];
  lineOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' } }
    }
  };

  donutLabels: string[] = ['Sueño ligero', 'Sueño profundo', 'Despierto'];
  donutData: any[] = [{ data: [], backgroundColor: ['#F2D5B0', '#E5B27F', '#CF9A66'], borderWidth: 0 }];
  donutOptions: ChartOptions<'doughnut'> = {
    responsive: true, cutout: '65%',
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 14 } } }
  };

  constructor(private reportsSvc: ReportsService) {}

  ngOnInit(): void {
    this.setRangeDays(7);
    this.loadDaily();
  }

  setTab(tab: 'diario'|'semanal'|'mensual') {
    this.activeTab = tab;
    this.errorMsg = '';
    if (tab === 'diario') { this.setRangeDays(7); this.loadDaily(); }
    if (tab === 'semanal') { this.setRangeDays(28); this.loadWeekly(); }
    if (tab === 'mensual') { this.setRangeDays(30); this.loadMonthly(); }
  }

  setRangeDays(days: number) {
    const end = new Date();
    const to = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59));
    const from = new Date(to); from.setUTCDate(to.getUTCDate() - (days - 1));
    this.from = from.toISOString(); this.to = to.toISOString();
  }

  private loadDaily() {
    this.loading = true;
    this.barLabels = []; this.barData[0].data = [];
    this.reportsSvc.getDaily(this.from, this.to, this.userId).subscribe({
      next: (res) => {
        this.barLabels = res.labels;
        this.barData[0].data = res.values;
        if (res.values.length) {
          const sum = res.values.reduce((a,b)=>a+b,0);
          this.promedioDia = Number((sum / res.values.length).toFixed(1));
          this.mejorDia = Math.max(...res.values);
          this.peorDia = Math.min(...res.values);
        } else {
          this.promedioDia = this.mejorDia = this.peorDia = 0;
        }
        this.loading = false;
      },
      error: () => { this.errorMsg = 'No se pudo cargar Diario'; this.loading = false; }
    });
  }

  private loadWeekly() {
    this.loading = true;
    this.lineLabels = []; this.lineData[0].data = [];
    this.reportsSvc.getWeekly(this.from, this.to, this.userId).subscribe({
      next: (res) => { this.lineLabels = res.labels; this.lineData[0].data = res.values; this.loading = false; },
      error: () => { this.errorMsg = 'No se pudo cargar Semanal'; this.loading = false; }
    });
  }

  private loadMonthly() {
    this.loading = true;
    this.donutData[0].data = [];
    this.reportsSvc.getMonthly(this.from, this.to, this.userId).subscribe({
      next: (res) => { this.donutLabels = res.labels; this.donutData[0].data = res.values; this.loading = false; },
      error: () => { this.errorMsg = 'No se pudo cargar Mensual'; this.loading = false; }
    });
  }

  exportarCorreo() {
    if (!this.email) { this.exportMsg = 'Ingresa tu correo.'; return; }
    this.sending = true; this.exportMsg = '';
    this.reportsSvc.exportarPorCorreo(this.activeTab, this.email).subscribe({
      next: (res) => { this.exportMsg = res?.message || 'Informe enviado'; this.sending = false; },
      error: () => { this.exportMsg = 'No se pudo enviar'; this.sending = false; }
    });
  }
}
