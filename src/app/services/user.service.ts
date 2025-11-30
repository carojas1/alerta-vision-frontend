import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Usuario {
  id?: number;
  nombre?: string;
  email: string;
  telefono: string;
  rol: string;
  estado?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = 'http://localhost:3000'; // Raíz del backend

  constructor(private http: HttpClient) {}

  // --- USUARIOS ---
  getUsuarios(): Observable<Usuario[]> { return this.http.get<Usuario[]>(`${this.baseUrl}/users`); }
  crearUsuario(data: Usuario): Observable<Usuario> { return this.http.post<Usuario>(`${this.baseUrl}/users`, data); }
  actualizarUsuario(id: number | string, data: Partial<Usuario>): Observable<Usuario> { return this.http.put<Usuario>(`${this.baseUrl}/users/${id}`, data); }
  eliminarUsuario(id: number | string): Observable<any> { return this.http.delete(`${this.baseUrl}/users/${id}`); }

  // --- HISTORIAL Y REPORTES (NUEVO) ---
  getAlertasUsuario(userId: number | string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/alerts/${userId}`);
  }

  getReporteDiario(userId: number | string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/reports/daily/${userId}`);
  }
}