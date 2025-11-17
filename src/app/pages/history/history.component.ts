import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router'; // <-- AGREGAMOS RouterModule
// BORRAMOS: trigger, transition, style, animate, query, stagger
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-history',
  standalone: true,
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css'],
  imports: [CommonModule, RouterModule], // <-- AGREGAMOS RouterModule
  // ¡BORRAMOS EL BLOQUE 'animations: [...]' DE AQUÍ!
})
export class HistoryComponent implements OnInit {
  alerts: any[] = [];
  
  // ¡Variable para el botón de WhatsApp! (Esto está bien)
  loggedInUserPhone = ''; 

  constructor(private router: Router, private alertService: AlertService) {}

  ngOnInit() {
    // Lógica para jalar tu teléfono (Esto está bien)
    if (typeof window !== 'undefined' && localStorage) {
      const telefonoGuardado = localStorage.getItem('telefono'); 
      if (telefonoGuardado) {
        this.loggedInUserPhone = telefonoGuardado.replace(/\s/g, '').replace('+', '');
        console.log('Teléfono para WhatsApp cargado:', this.loggedInUserPhone);
      } else {
        console.error('No se encontró el teléfono del usuario en localStorage para WhatsApp');
      }
    }

    // Jalamos las alertas (Esto está bien)
    this.alertService.getAlerts()
      .subscribe({
        next: (data) => {
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