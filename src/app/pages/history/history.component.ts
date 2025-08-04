import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { AlertService } from '../../services/alert.service'; // ajusta el path si es necesario

@Component({
  selector: 'app-history',
  standalone: true,
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css'],
  imports: [CommonModule],
  animations: [
    trigger('listAnimation', [
      transition(':enter', [
        query('.alert-item', [
          style({ opacity: 0, transform: 'translateY(40px)' }),
          stagger(90, [
            animate('700ms cubic-bezier(.51,1.13,.61,.99)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('itemAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('500ms cubic-bezier(.51,1.13,.61,.99)', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class HistoryComponent implements OnInit {
  alerts: any[] = [];

  constructor(private router: Router, private alertService: AlertService) {}

  ngOnInit() {
    this.alertService.getAlerts()
      .subscribe({
        next: (data) => {
          // Asegúrate de invertir si quieres mostrar primero la más reciente
          this.alerts = (data || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        },
        error: (err) => {
          console.error('No se pudieron cargar las alertas', err);
        }
      });
  }

  goTo(ruta: string) {
    this.router.navigate([`/${ruta}`]);
  }

  formatDateTime(dateStr: string): { fecha: string; hora: string } {
    // Manejar fechas nulas o mal formateadas
    if (!dateStr) return { fecha: 'Fecha no válida', hora: 'Fecha no válida' };
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return { fecha: 'Fecha no válida', hora: 'Fecha no válida' };

    const optionsFecha: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const optionsHora: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
    return {
      fecha: date.toLocaleDateString('es-EC', optionsFecha),
      hora: date.toLocaleTimeString('es-EC', optionsHora)
    };
  }

  encode(text: string): string {
    return encodeURIComponent(text || '');
  }
}
