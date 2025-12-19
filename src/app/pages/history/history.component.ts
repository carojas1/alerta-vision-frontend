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

  // 🔵 Estado de los lentes / API
  lensStatus: LensStatus = 'desconocido';

  constructor(
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const userIdStr =
      typeof window !== 'undefined'
        ? localStorage.getItem('userId')
        : null;

    this.loggedInUserPhone =
      typeof window !== 'undefined'
        ? localStorage.getItem('userPhone')
        : null;

    if (!userIdStr) {
      this.error = 'No se encontró el usuario. Vuelve a iniciar sesión.';
      this.lensStatus = 'error';
      return;
    }

    const userId = Number(userIdStr);
    this.cargarAlertas(userId);
  }

  get alerts(): Alerta[] {
    return this.alertas;
  }

  cargarAlertas(userId: number): void {
    this.loading = true;
    this.error = undefined;
    this.lensStatus = 'desconocido';

    this.alertService.getAlertsByUser(userId).subscribe({
      next: (data: Alerta[]) => {
        console.log('📥 ALERTAS DESDE API:', data); // 👈 revisa en consola

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
      error: (err: unknown) => {
        console.error('❌ Error cargando alertas', err);
        this.error = 'No se pudo conectar con el servidor de alertas.';
        this.lensStatus = 'error';
        this.loading = false;
      }
    });
  }

  private getDate(alert: Alerta): Date {
    const raw = alert.createdAt || alert.created_at || '';
    return raw ? new Date(raw) : new Date(0);
  }

  encode(text?: string): string {
    return encodeURIComponent(text || '');
  }

  goTo(path: string): void {
    this.router.navigate(['/' + path]);
  }
}
