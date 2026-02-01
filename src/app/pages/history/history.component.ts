import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AlertService, Alerta } from '../../services/alert.service';

type LensStatus = 'desconocido' | 'ok' | 'sin_alertas' | 'error';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {

  alertas: Alerta[] = [];
  loading = false;
  error?: string;
  loggedInUserPhone: string | null = null;
  lensStatus: LensStatus = 'desconocido';

  constructor(
    private alertService: AlertService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // ✅ VERIFICAR TOKEN ANTES DE HACER CUALQUIER COSA
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!token) {
      console.log('⚠️ No hay token, redirigiendo a login...');
      this.router.navigate(['/login']);
      return;
    }

    this.loggedInUserPhone = localStorage.getItem('userPhone') || null;
    this.cargarAlertas();
  }

  cargarAlertas(): void {
    this.loading = true;
    this.error = undefined;
    this.lensStatus = 'desconocido';

    this.alertService.getMyAlerts().subscribe({
      next: (data: Alerta[]) => {
        console.log('📥 ALERTAS RECIBIDAS:', data);

        this.alertas = (data || []).sort((a, b) => {
          const da = this.getDate(a);
          const db = this.getDate(b);
          return db.getTime() - da.getTime();
        });

        if (this.alertas.length > 0) {
          this.lensStatus = 'ok';
        } else {
          this.lensStatus = 'sin_alertas';
        }

        this.loading = false;
      },
      error: (err: any) => {
        console.error('❌ Error cargando alertas:', err);

        // Si es 401, redirigir a login
        if (err.status === 401) {
          console.log('🔄 Token inválido, redirigiendo a login...');
          localStorage.removeItem('token');
          this.router.navigate(['/login']);
          return;
        }

        // Si es 404, mostrar como "sin alertas"
        if (err.status === 404) {
          this.alertas = [];
          this.lensStatus = 'sin_alertas';
          this.error = undefined;
        } else {
          this.error = 'No se pudo conectar con el servidor.';
          this.lensStatus = 'error';
        }
        this.loading = false;
      }
    });
  }

  private getDate(alert: Alerta): Date {
    const raw = alert.fecha || alert.createdAt || alert.created_at || '';
    return raw ? new Date(raw) : new Date(0);
  }

  encode(text?: string): string {
    return encodeURIComponent(text || '');
  }

  getMensaje(alert: Alerta): string {
    return alert.mensaje || alert.message || 'Alerta de fatiga detectada';
  }

  goTo(path: string): void {
    this.router.navigate(['/' + path]);
  }
}
