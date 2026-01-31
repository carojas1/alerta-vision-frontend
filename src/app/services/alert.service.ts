import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../enviromets/environment';

// Modelo de alerta que viene del backend
export interface Alerta {
  id: number;
  usuarioId?: number;
  tipoAlerta?: string;
  mensaje?: string;
  nivelFatiga?: number;
  fecha?: string;
  // Compatibilidad con diferentes formatos
  message?: string;
  tipo?: string;
  nivel?: string;
  createdAt?: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  // ✅ Endpoint correcto: /alerts (plural, como está en el backend)
  private apiUrl = `${environment.apiUrl}/alerts`;

  constructor(private http: HttpClient) {
    console.log('🔧 AlertService inicializado');
    console.log('🌐 API URL:', this.apiUrl);
    console.log('🔑 Token en localStorage:', !!localStorage.getItem('token'));
  }

  /**
   * ✅ MÉTODO PRINCIPAL: Obtiene las alertas del usuario logueado
   * El backend toma el userId del JWT token automáticamente
   * NO necesita pasar userId en la URL
   */
  getMyAlerts(): Observable<Alerta[]> {
    console.log('🌐 Consultando alertas (JWT):', this.apiUrl);
    return this.http.get<Alerta[]>(this.apiUrl).pipe(
      tap(data => console.log('✅ Alertas recibidas del backend:', data))
    );
  }

  /**
   * Alias para compatibilidad (por si algún componente aún usa getAlertsByUser)
   * @deprecated Usar getMyAlerts() en su lugar
   */
  getAlertsByUser(userId?: number | string): Observable<Alerta[]> {
    console.log('⚠️ getAlertsByUser está deprecado, usando getMyAlerts()');
    return this.getMyAlerts();
  }

  /**
   * Obtiene todas las alertas (solo para admin)
   */
  getAllAlerts(): Observable<Alerta[]> {
    console.log('🌐 Consultando todas las alertas:', this.apiUrl);
    return this.http.get<Alerta[]>(this.apiUrl).pipe(
      tap(data => console.log('✅ Todas las alertas recibidas:', data))
    );
  }
}
