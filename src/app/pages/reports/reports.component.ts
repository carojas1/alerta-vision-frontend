import { Component, OnInit, Inject, ViewChild } from '@angular/core'; 
import { DOCUMENT } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts'; 
import { ChartOptions, ChartConfiguration } from 'chart.js';
import { ReportsService } from '../../services/reports.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule, RouterModule],
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
  
  email = ''; // Para el input manual
  
  // --- VARIABLES PARA EL USUARIO REGISTRADO ---
  userEmail = ''; 
  userName = ''; 

  promedioDia = 0; mejorDia = 0; peorDia = 0;
  isDarkMode = true;
  notificationsEnabled = true;

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  // --- CONFIGURACIÓN DE GRÁFICAS (Sin cambios) ---
  barOptions: ChartOptions<'bar'> = { responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#000' } }, y: { beginAtZero: true, ticks: { stepSize: 2, color: '#000' }, grid: { color: '#eee' } } } };
  lineOptions: ChartOptions<'line'> = { responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#000' } }, y: { beginAtZero: true, grid: { color: '#eee' }, ticks: { color: '#000' } } } };
  donutOptions: ChartOptions<'doughnut'> = { responsive: true, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 14, color: '#000' } } } };
  
  barLabels: string[] = [];
  barData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [{ data: [], label: 'Somnolencia', borderRadius: 8, barThickness: 24 }] };
  lineLabels: string[] = [];
  lineData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [{ data: [], label: 'Somnolencia semanal', fill: 'origin', tension: 0.35, pointRadius: 3 }] };
  donutLabels: string[] = ['Sueño ligero', 'Sueño profundo', 'Despierto'];
  donutData: ChartConfiguration<'doughnut'>['data'] = { labels: this.donutLabels, datasets: [{ data: [], borderWidth: 0 }] };

  constructor(
    private reportsSvc: ReportsService,
    private router: Router,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    // 1. OBTENER DATOS DEL USUARIO
    // Aquí simulamos obtener los datos. En tu app real, úsalo desde tu AuthService.
    // Ejemplo: const user = this.authService.usuarioActual;
    this.userName = localStorage.getItem('userName') || 'Carlos Rojas'; 
    this.userEmail = localStorage.getItem('userEmail') || 'usuario@registrado.com';

    // 2. TEMA
    let savedThemeIsDark = true;
    if (typeof window !== 'undefined' && localStorage) {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light') {
        this.isDarkMode = false;
        savedThemeIsDark = false;
        this.document.body.classList.add('light-mode');
      } else {
        this.isDarkMode = true;
        this.document.body.classList.remove('light-mode');
      }
    }
    this.updateChartColors(savedThemeIsDark);
    this.setRangeDays(7);
    this.loadDaily();
  }
  
  // --- ACTUARLIZAR COLORES (Sin cambios) ---
  updateChartColors(isDark: boolean) {
    const bodyStyles = getComputedStyle(this.document.body || document.body);
    const primary = bodyStyles.getPropertyValue('--color-primary').trim();
    const primary_light = bodyStyles.getPropertyValue('--color-primary').trim().replace(')', ', 0.2)').replace('rgb', 'rgba');
    const secondary = bodyStyles.getPropertyValue('--color-primary-hover').trim();
    const text = bodyStyles.getPropertyValue('--color-text-secondary').trim();
    const text_tertiary = bodyStyles.getPropertyValue('--color-text-tertiary').trim();
    const grid = bodyStyles.getPropertyValue('--color-grid').trim();

    this.barData.datasets[0].backgroundColor = primary;
    this.lineData.datasets[0].borderColor = primary;
    this.lineData.datasets[0].backgroundColor = primary_light;
    this.lineData.datasets[0].pointBackgroundColor = primary;
    this.donutData.datasets[0].backgroundColor = [primary, secondary, text_tertiary];

    if (this.barOptions.scales?.['x']?.ticks) this.barOptions.scales['x'].ticks.color = text;
    if (this.barOptions.scales?.['y']?.ticks) this.barOptions.scales['y'].ticks.color = text;
    if (this.barOptions.scales?.['y']?.grid) this.barOptions.scales['y'].grid.color = grid;
    if (this.lineOptions.scales?.['x']?.ticks) this.lineOptions.scales['x'].ticks.color = text;
    if (this.lineOptions.scales?.['y']?.ticks) this.lineOptions.scales['y'].ticks.color = text;
    if (this.lineOptions.scales?.['y']?.grid) this.lineOptions.scales['y'].grid.color = grid;
    if (this.donutOptions.plugins?.legend?.labels) this.donutOptions.plugins.legend.labels.color = text;
    this.chart?.update();
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
    this.updateChartColors(this.isDarkMode); 
  }
  toggleNotifications() { this.notificationsEnabled = !this.notificationsEnabled; }
  goTo(ruta: string) { this.router.navigate([`/${ruta}`]); }

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
    this.loading = true; this.barLabels = []; this.barData.datasets[0].data = []; 
    this.reportsSvc.getDaily(this.from, this.to, this.userId).subscribe({
      next: (res) => {
        this.barLabels = res.labels; this.barData.labels = res.labels; this.barData.datasets[0].data = res.values; 
        if (res.values.length) {
          const sum = res.values.reduce((a,b)=>a+b,0);
          this.promedioDia = Number((sum / res.values.length).toFixed(1));
          this.mejorDia = Math.max(...res.values);
          this.peorDia = Math.min(...res.values);
        } else { this.promedioDia = this.mejorDia = this.peorDia = 0; }
        this.loading = false; this.chart?.update(); 
      },
      error: () => { this.errorMsg = 'Error al cargar datos'; this.loading = false; }
    });
  }
  private loadWeekly() {
    this.loading = true; this.lineLabels = []; this.lineData.datasets[0].data = []; 
    this.reportsSvc.getWeekly(this.from, this.to, this.userId).subscribe({
      next: (res) => { this.lineLabels = res.labels; this.lineData.labels = res.labels; this.lineData.datasets[0].data = res.values; this.loading = false; this.chart?.update(); },
      error: () => { this.errorMsg = 'Error al cargar datos'; this.loading = false; }
    });
  }
  private loadMonthly() {
    this.loading = true; this.donutData.datasets[0].data = [];
    this.reportsSvc.getMonthly(this.from, this.to, this.userId).subscribe({
      next: (res) => { this.donutLabels = res.labels; this.donutData.labels = res.labels; this.donutData.datasets[0].data = res.values; this.loading = false; this.chart?.update(); },
      error: () => { this.errorMsg = 'Error al cargar datos'; this.loading = false; }
    });
  }

  // --- LÓGICA DE ENVÍO DE CORREO ---
  
  // 1. Enviar al correo REGISTRADO
  exportarCorreoUsuario() {
    if (!this.userEmail) { this.exportMsg = 'No hay correo registrado.'; return; }
    this.sending = true; this.exportMsg = '';
    
    this.reportsSvc.exportarPorCorreo(this.activeTab, this.userEmail).subscribe({
      next: (res) => { this.exportMsg = res?.message || 'Enviado correctamente.'; this.sending = false; },
      error: () => { this.exportMsg = 'Error al enviar.'; this.sending = false; }
    });
  }

  // 2. Enviar a correo MANUAL
  exportarCorreoManual() {
    if (!this.email) { this.exportMsg = 'Escribe un correo válido.'; return; }
    this.sending = true; this.exportMsg = '';
    
    this.reportsSvc.exportarPorCorreo(this.activeTab, this.email).subscribe({
      next: (res) => { this.exportMsg = res?.message || 'Enviado.'; this.sending = false; },
      error: () => { this.exportMsg = 'Error al enviar.'; this.sending = false; }
    });
  }
}