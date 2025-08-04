import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AlertService {
  // Usa la IP local del backend
  private apiUrl = "http://192.168.18.210:3000/alert";

  constructor(private http: HttpClient) {}

  // Obtener todas las alertas
  getAlerts(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}
