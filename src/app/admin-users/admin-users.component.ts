import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, Usuario } from '../services/user.service';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css'],
  imports: [CommonModule, FormsModule, NgChartsModule]
})
export class AdminUsersComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  usuarios: Usuario[] = [];
  alertas: any[] = []; // Para el historial
  isLoading = true;
  
  // Estado del Modal
  showModal = false;
  isEditing = false;
  currentTab: string = 'info'; // 'info', 'historial', 'reportes'
  currentUser: Usuario = { nombre: '', email: '', telefono: '', rol: 'usuario' };

  // --- CONFIGURACIÓN DE GRÁFICAS (Tu código de ReportsComponent) ---
  barOptions: ChartOptions<'bar'> = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: '#f3f3f3' } } } };
  barData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [{ data: [], label: 'Nivel Somnolencia', backgroundColor: '#fbbf24', borderRadius: 6, barThickness: 20 }] };
  
  promedioDia = 0; mejorDia = 0; peorDia = 0;

  constructor(private userService: UserService) {}

  ngOnInit() { this.cargarUsuarios(); }

  cargarUsuarios() {
    this.isLoading = true;
    this.userService.getUsuarios().subscribe({
      next: (data) => { this.usuarios = data.map(u => ({...u, estado: 'activo'})); this.isLoading = false; },
      error: (e) => { console.error(e); this.isLoading = false; }
    });
  }

  // --- ABRIR MODAL Y GESTIONAR PESTAÑAS ---
  openModal(user?: Usuario, tab: string = 'info') {
    this.showModal = true;
    this.currentTab = tab;

    if (user) {
      this.isEditing = true;
      this.currentUser = { ...user };
      // Si abrimos historial o reportes, cargamos datos
      if (tab === 'historial') this.cargarHistorial(user.id!);
      if (tab === 'reportes') this.cargarReportes(user.id!);
    } else {
      this.isEditing = false;
      this.currentUser = { nombre: '', email: '', telefono: '', rol: 'usuario' };
    }
  }

  cambiarPestana(tab: string) {
    this.currentTab = tab;
    if (this.currentUser.id) {
      if (tab === 'historial') this.cargarHistorial(this.currentUser.id);
      if (tab === 'reportes') this.cargarReportes(this.currentUser.id);
    }
  }

  // --- LÓGICA DE HISTORIAL (Tu código de HistoryComponent) ---
  cargarHistorial(id: number | string) {
    this.userService.getAlertasUsuario(id).subscribe(data => {
      // Ordenamos por fecha como en tu código
      this.alertas = (data || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    });
  }

  formatDateTime(dateStr: string): { fecha: string; hora: string } {
    if (!dateStr) return { fecha: '--', hora: '--' };
    const date = new Date(dateStr);
    return {
      fecha: date.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' }),
      hora: date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
    };
  }

  // --- LÓGICA DE REPORTES (Tu código de ReportsComponent) ---
  cargarReportes(id: number | string) {
    this.userService.getReporteDiario(id).subscribe(res => {
      this.barData.labels = res.labels;
      this.barData.datasets[0].data = res.values;
      
      // Cálculos matemáticos de tu código
      if (res.values.length) {
        const sum = res.values.reduce((a:number,b:number)=>a+b,0);
        this.promedioDia = Number((sum / res.values.length).toFixed(1));
        this.mejorDia = Math.max(...res.values);
        this.peorDia = Math.min(...res.values);
      }
      this.chart?.update();
    });
  }

  // --- CRUD USUARIOS ---
  guardarUsuario() {
    if(!this.currentUser.email) return alert("Email obligatorio");
    if(!this.currentUser.nombre) this.currentUser.nombre = this.currentUser.email.split('@')[0];

    const obs = (this.isEditing && this.currentUser.id)
      ? this.userService.actualizarUsuario(this.currentUser.id, this.currentUser)
      : (delete this.currentUser.id, this.userService.crearUsuario(this.currentUser));

    obs.subscribe({
      next: () => { this.cargarUsuarios(); this.closeModal(); },
      error: (e) => { if(e.status===404 && this.isEditing) this.guardarUsuario(); else alert(e.message); } // Reintento si es 404 al editar
    });
  }

  eliminarUsuario(id: any) {
    if(id && confirm('¿Eliminar usuario?')) {
      this.userService.eliminarUsuario(id).subscribe({
        next: () => this.usuarios = this.usuarios.filter(u => u.id !== id),
        error: (e) => { if(e.status===404) this.usuarios = this.usuarios.filter(u => u.id !== id); }
      });
    }
  }
  
  closeModal() { this.showModal = false; }
  getInitial(n: string|undefined) { return n ? n.charAt(0).toUpperCase() : 'U'; }
}