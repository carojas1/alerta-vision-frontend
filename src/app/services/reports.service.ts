import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../enviromets/environment';

export interface SeriesResponse {
  labels: string[];
  values: number[];
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  // ✅ Endpoint correcto: /reports
  private base = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {
    console.log('🔧 ReportsService inicializado');
    console.log('🌐 API URL:', this.base);
  }

  private buildParams(from: string, to: string, userId?: string): HttpParams {
    let p = new HttpParams().set('from', from).set('to', to);
    if (userId) {
      p = p.set('userId', userId);
    }
    return p;
  }

  /**
   * ✅ Reportes DIARIOS - datos reales de PostgreSQL
   */
  getDaily(from: string, to: string, userId?: string): Observable<SeriesResponse> {
    const url = `${this.base}/daily`;
    console.log('🌐 Consultando reportes diarios:', url);
    
    return this.http.get<SeriesResponse>(url, {
      params: this.buildParams(from, to, userId)
    }).pipe(
      tap(data => console.log('✅ Datos diarios recibidos:', data))
    );
  }

  /**
   * ✅ Reportes SEMANALES - datos reales de PostgreSQL
   */
  getWeekly(from: string, to: string, userId?: string): Observable<SeriesResponse> {
    const url = `${this.base}/weekly`;
    console.log('🌐 Consultando reportes semanales:', url);
    
    return this.http.get<SeriesResponse>(url, {
      params: this.buildParams(from, to, userId)
    }).pipe(
      tap(data => console.log('✅ Datos semanales recibidos:', data))
    );
  }

  /**
   * ✅ Reportes MENSUALES - datos reales de PostgreSQL
   */
  getMonthly(from: string, to: string, userId?: string): Observable<SeriesResponse> {
    const url = `${this.base}/monthly`;
    console.log('🌐 Consultando reportes mensuales:', url);
    
    return this.http.get<SeriesResponse>(url, {
      params: this.buildParams(from, to, userId)
    }).pipe(
      tap(data => console.log('✅ Datos mensuales recibidos:', data))
    );
  }

  /**
   * Exportar reporte por correo
   */
  exportarPorCorreo(tab: string, email: string): Observable<{ message: string }> {
    console.log('📧 Enviando reporte a:', email);
    
    return this.http.post<{ message: string }>(`${this.base}/export`, {
      tab,
      email
    }).pipe(
      tap(res => console.log('✅ Respuesta export:', res))
    );
  }
}
