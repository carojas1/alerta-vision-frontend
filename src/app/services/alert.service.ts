import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviromets/environment';

// Modelo que se adapta a lo que venga del backend
export interface Alerta {
  id: number;
  mensaje?: string;    // algunos backends usan "mensaje"
  message?: string;    // otros usan "message"
  nivel?: string;
  tipo?: string;
  createdAt?: string;  // camelCase
  created_at?: string; // snake_case
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  // https://alerta-vision-backend.onrender.com/alerts
  private apiUrl = `${environment.apiUrl}/alerts`;

  constructor(private http: HttpClient) {}

  // Todas las alertas (si tu backend lo permite)
  getAlerts(): Observable<Alerta[]> {
    return this.http.get<Alerta[]>(this.apiUrl);
  }

  // Alertas de un usuario
  getAlertsByUser(userId: number | string): Observable<Alerta[]> {
    return this.http.get<Alerta[]>(`${this.apiUrl}/${userId}`);
  }
}
