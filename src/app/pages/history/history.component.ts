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

  // ✅ Variable única: alertas (igual en TS y HTML)
  alertas: Alerta[] = [];
  loading = false;
  error?: string;

  loggedInUserPhone: string | null = null;

  // Estado de los lentes / API
  lensStatus: LensStatus = 'desconocido';

  constructor(
    private alertService: AlertService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Obtener teléfono para WhatsApp (no necesario para la consulta)
    this.loggedInUserPhone =
      typeof window !== 'undefined'
        ? localStorage.getItem('userPhone')
        : null;

    // ✅ Cargar alertas sin necesidad de userId (el JWT tiene la info)
    this.cargarAlertas();
  }

  /**
   * ✅ Carga alertas usando getMyAlerts() - sin userId en URL
   * El backend identifica al usuario por el JWT token
   */
  cargarAlertas(): void {
    this.loading = true;
    this.error = undefined;
    this.lensStatus = 'desconocido';

    // ✅ Llamar al método correcto sin pasar userId
    this.alertService.getMyAlerts().subscribe({
      next: (data: Alerta[]) => {
        console.log('📥 ALERTAS RECIBIDAS:', data);

        // Ordenar por fecha (más recientes primero)
        this.alertas = (data || []).sort((a, b) => {
          const da = this.getDate(a);
          const db = this.getDate(b);
          return db.getTime() - da.getTime();
        });

        if (this.alertas.length > 0) {
          this.lensStatus = 'ok';
          console.log('✅ Alertas cargadas:', this.alertas.length);
        } else {
          this.lensStatus = 'sin_alertas';
          console.log('📭 No hay alertas para este usuario');
        }

        this.loading = false;
      },
      error: (err: any) => {
        console.error('❌ Error cargando alertas:', err);

        // Si es 404, mostrar como "sin alertas" en vez de error
        if (err.status === 404) {
          this.alertas = [];
          this.lensStatus = 'sin_alertas';
          this.error = undefined;
          console.log('📭 Endpoint no encontrado, mostrando vacío');
        } else {
          this.error = 'No se pudo conectar con el servidor. Verifica tu conexión.';
          this.lensStatus = 'error';
        }
        this.loading = false;
      }
    });
  }

  /**
   * Extrae la fecha de una alerta (soporta múltiples formatos)
   */
  private getDate(alert: Alerta): Date {
    const raw = alert.fecha || alert.createdAt || alert.created_at || '';
    return raw ? new Date(raw) : new Date(0);
  }

  /**
   * Codifica texto para URL (WhatsApp)
   */
  encode(text?: string): string {
    return encodeURIComponent(text || '');
  }

  /**
   * Obtiene el mensaje de una alerta (soporta múltiples formatos)
   */
  getMensaje(alert: Alerta): string {
    return alert.mensaje || alert.message || 'Alerta de fatiga detectada';
  }

  /**
   * Navegación
   */
  goTo(path: string): void {
    this.router.navigate(['/' + path]);
  }
}
