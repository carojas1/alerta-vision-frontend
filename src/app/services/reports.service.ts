import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  constructor(private http: HttpClient) {}

  exportarPorCorreo(tipo: string): Observable<any> {
    // Cambia '/api/reports/export-email' por la URL real de tu backend si es necesario
    return this.http.post('/api/reports/export-email', { tipo });
  }
}
