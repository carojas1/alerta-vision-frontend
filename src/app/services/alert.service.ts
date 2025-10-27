import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AlertService {
  // Conecta con el backend local (sin IP)
  private apiUrl = "http://localhost:3000/alert";

  constructor(private http: HttpClient) {}

  // Obtener todas las alertas
  getAlerts(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}
