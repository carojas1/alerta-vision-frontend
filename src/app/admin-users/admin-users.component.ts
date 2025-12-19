import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UserService, Usuario, ReportResponse } from '../services/user.service';

import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css'],
  imports: [CommonModule, FormsModule, NgChartsModule],
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
  currentUser: Usuario = {
    nombre: '',
    email: '',
    telefono: '',
    rol: 'usuario',
  };

  // --- CONFIGURACIÓN DE GRÁFICAS ---
  barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: '#f3f3f3' } },
    },
  };

  barData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Nivel Somnolencia',
        backgroundColor: '#fbbf24',
        borderRadius: 6,
        barThickness: 20,
      },
    ],
  };

  promedioDia = 0;
  mejorDia = 0;
  peorDia = 0;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  // =====================================================
  //  USUARIOS
  // =====================================================
  cargarUsuarios(): void {
    this.isLoading = true;
    this.userService.getUsuarios().subscribe({
      next: (data: Usuario[]) => {
        this.usuarios = data.map((u: Usuario) => ({
          ...u,
          estado: u.estado ?? 'activo',
        }));
        this.isLoading = false;
      },
      error: (e: any) => {
        console.error(e);
        this.isLoading = false;
      },
    });
  }

  // =====================================================
  //  MODAL Y PESTAÑAS
  // =====================================================
  openModal(user?: Usuario, tab: string = 'info'): void {
    this.showModal = true;
    this.currentTab = tab;

    if (user) {
      this.isEditing = true;
      this.currentUser = { ...user };

      if (tab === 'historial' && user.id != null) {
        this.cargarHistorial(user.id);
      }
      if (tab === 'reportes' && user.id != null) {
        this.cargarReportes(user.id);
      }
    } else {
      this.isEditing = false;
      this.currentUser = {
        nombre: '',
        email: '',
        telefono: '',
        rol: 'usuario',
      };
    }
  }

  cambiarPestana(tab: string): void {
    this.currentTab = tab;

    if (this.currentUser.id != null) {
      if (tab === 'historial') this.cargarHistorial(this.currentUser.id);
      if (tab === 'reportes') this.cargarReportes(this.currentUser.id);
    }
  }

  // =====================================================
  //  HISTORIAL (ALERTAS)
  // =====================================================
  cargarHistorial(id: number | string): void {
    this.userService.getAlertasUsuario(id).subscribe({
      next: (data: any[]) => {
        this.alertas = (data || []).sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );
      },
      error: (e: any) => {
        console.error(e);
      },
    });
  }

  formatDateTime(dateStr: string): { fecha: string; hora: string } {
    if (!dateStr) return { fecha: '--', hora: '--' };
    const date = new Date(dateStr);
    return {
      fecha: date.toLocaleDateString('es-EC', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      hora: date.toLocaleTimeString('es-EC', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  }

  // =====================================================
  //  REPORTES
  // =====================================================
  cargarReportes(id: number | string): void {
    this.userService.getReporteDiario(id).subscribe({
      next: (res: ReportResponse) => {
        this.barData.labels = res.labels;
        this.barData.datasets[0].data = res.values;

        if (res.values && res.values.length) {
          const sum = res.values.reduce(
            (a: number, b: number) => a + b,
            0
          );
          this.promedioDia = Number(
            (sum / res.values.length).toFixed(1)
          );
          this.mejorDia = Math.max(...res.values);
          this.peorDia = Math.min(...res.values);
        } else {
          this.promedioDia = this.mejorDia = this.peorDia = 0;
        }

        this.chart?.update();
      },
      error: (e: any) => {
        console.error(e);
      },
    });
  }

  // =====================================================
  //  CRUD USUARIOS
  // =====================================================
  guardarUsuario(): void {
    if (!this.currentUser.email) {
      alert('Email obligatorio');
      return;
    }

    if (!this.currentUser.nombre) {
      this.currentUser.nombre = this.currentUser.email.split('@')[0];
    }

    const obs =
      this.isEditing && this.currentUser.id
        ? this.userService.actualizarUsuario(
            this.currentUser.id,
            this.currentUser
          )
        : this.userService.crearUsuario({
            ...this.currentUser,
            id: undefined,
          });

    obs.subscribe({
      next: () => {
        this.cargarUsuarios();
        this.closeModal();
      },
      error: (e: any) => {
        // dejo tu idea básica, pero sin recursión infinita
        if (e.status === 404 && this.isEditing && this.currentUser) {
          this.userService
            .crearUsuario({
              ...this.currentUser,
              id: undefined,
            })
            .subscribe({
              next: () => {
                this.cargarUsuarios();
                this.closeModal();
              },
              error: (err: any) => {
                console.error(err);
                alert(err.message || 'Error al guardar usuario');
              },
            });
        } else {
          console.error(e);
          alert(e.message || 'Error al guardar usuario');
        }
      },
    });
  }

  eliminarUsuario(id: number | string | undefined): void {
    if (!id) return;

    if (confirm('¿Eliminar usuario?')) {
      this.userService.eliminarUsuario(id).subscribe({
        next: () => {
          this.usuarios = this.usuarios.filter((u) => u.id !== id);
        },
        error: (e: any) => {
          console.error(e);
          if (e.status === 404) {
            this.usuarios = this.usuarios.filter((u) => u.id !== id);
          }
        },
      });
    }
  }

  // =====================================================
  //  OTROS
  // =====================================================
  closeModal(): void {
    this.showModal = false;
  }

  getInitial(n: string | undefined): string {
    return n ? n.charAt(0).toUpperCase() : 'U';
  }
}
