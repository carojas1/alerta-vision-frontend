import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviromets/environment';

// ====== MODELOS ======
export interface Usuario {
  id?: number;
  nombre?: string;
  email: string;
  telefono: string;
  rol: string;      // 'usuario' | 'admin' | lo que uses
  estado?: string;  // 'activo' | 'inactivo' | etc.
}

export interface ReportResponse {
  labels: string[];
  values: number[];
}

// ====== SERVICIO ======
@Injectable({ providedIn: 'root' })
export class UserService {
  // Usa la misma URL base que el resto de servicios
  private baseUrl = environment.apiUrl; 
  // ej: https://alerta-vision-backend.onrender.com

  constructor(private http: HttpClient) {}

  // --- CRUD USUARIOS ---
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.baseUrl}/users`);
  }

  crearUsuario(data: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.baseUrl}/users`, data);
  }

  actualizarUsuario(
    id: number | string,
    data: Partial<Usuario>
  ): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.baseUrl}/users/${id}`, data);
  }

  eliminarUsuario(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${id}`);
  }

  // --- HISTORIAL DE ALERTAS DE UN USUARIO ---
  getAlertasUsuario(userId: number | string): Observable<any[]> {
    // Ajusta el endpoint si tu backend usa otro (ej: /alert/user/:id)
    return this.http.get<any[]>(`${this.baseUrl}/alerts/${userId}`);
  }

  // --- REPORTE DIARIO DE UN USUARIO ---
  getReporteDiario(userId: number | string): Observable<ReportResponse> {
    // Ajusta el endpoint si en tu backend es distinto
    return this.http.get<ReportResponse>(`${this.baseUrl}/reports/daily/${userId}`);
  }
}
