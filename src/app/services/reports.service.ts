import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  constructor(private http: HttpClient) {}

  // Cambia la IP por la del backend
  exportarPorCorreo(tab: string, email: string): Observable<any> {
    return this.http.post('http://192.168.18.210:3000/reports/export', { tab, email });
  }
}
