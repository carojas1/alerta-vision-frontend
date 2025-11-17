import { Component, OnInit, Inject } from '@angular/core'; // <-- ¡MIRA AQUÍ!
import { DOCUMENT } from '@angular/common'; // <-- ¡MIRA AQUÍ!
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ChartOptions } from 'chart.js';
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
  email = '';
  promedioDia = 0; mejorDia = 0; peorDia = 0;

  // --- VARIABLES PARA AJUSTES ---
  isDarkMode = true; // Por defecto en modo "pepa"
  notificationsEnabled = true;

  // --- GRÁFICAS CON ESTILO "PEPA" (AZUL/NEÓN) ---
  // (Dejamos los colores "pepa" que ya pusimos)
  barLabels: string[] = [];
  barData: any[] = [{ data: [], label: 'Somnolencia', backgroundColor: '#00AFFF', borderRadius: 8, barThickness: 24 }];
  barOptions: ChartOptions<'bar'> = { /* ... (tu código de opciones pepa) ... */ };
  lineLabels: string[] = [];
  lineData: any[] = [{ data: [], label: 'Somnolencia semanal', fill: 'origin', borderColor: '#00AFFF', backgroundColor: 'rgba(0, 175, 255, 0.2)', tension: 0.35, pointRadius: 3, pointBackgroundColor: '#00AFFF' }];
  lineOptions: ChartOptions<'line'> = { /* ... (tu código de opciones pepa) ... */ };
  donutLabels: string[] = ['Sueño ligero', 'Sueño profundo', 'Despierto'];
  donutData: any[] = [{ data: [], backgroundColor: ['#00AFFF', '#0077FF', '#9eaecf'], borderWidth: 0 }];
  donutOptions: ChartOptions<'doughnut'> = { /* ... (tu código de opciones pepa) ... */ };

  constructor(
    private reportsSvc: ReportsService,
    private router: Router,
    @Inject(DOCUMENT) private document: Document // <-- ¡MIRA AQUÍ! Inyectamos DOCUMENT
  ) {}

  ngOnInit(): void {
    // --- ¡LÓGICA NUEVA PARA CARGAR EL TEMA! ---
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
    // --- FIN DE LÓGICA NUEVA ---

    this.setRangeDays(7);
    this.loadDaily();
  }

  // --- ¡FUNCIÓN DE MODO OSCURO ARREGLADA! ---
  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      this.document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
      console.log('Cambiando a Modo Oscuro');
    } else {
      this.document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
      console.log('Cambiando a Modo Claro');
    }
  }
  // --- FIN DE FUNCIÓN ARREGLADA ---

  toggleNotifications() {
    this.notificationsEnabled = !this.notificationsEnabled;
    console.log('Notificaciones:', this.notificationsEnabled);
  }

  goTo(ruta: string) {
    this.router.navigate([`/${ruta}`]);
  }

  // --- LÓGICA DE GRÁFICAS (SIN TOCAR) ---
  // (Aquí va todo tu código de setTab, loadDaily, loadWeekly, loadMonthly, exportarCorreo, etc.)
  // ...
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