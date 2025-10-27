import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviromets/environment';

export interface SeriesResponse { labels: string[]; values: number[]; }

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private base = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  private params(from: string, to: string, userId?: string) {
    let p = new HttpParams().set('from', from).set('to', to);
    if (userId) p = p.set('userId', userId);
    return p;
  }

  getDaily(from: string, to: string, userId?: string): Observable<SeriesResponse> {
    return this.http.get<SeriesResponse>(`${this.base}/daily`, { params: this.params(from, to, userId) });
  }

  getWeekly(from: string, to: string, userId?: string): Observable<SeriesResponse> {
    return this.http.get<SeriesResponse>(`${this.base}/weekly`, { params: this.params(from, to, userId) });
  }

  getMonthly(from: string, to: string, userId?: string): Observable<SeriesResponse> {
    return this.http.get<SeriesResponse>(`${this.base}/monthly`, { params: this.params(from, to, userId) });
  }

  exportarPorCorreo(tab: 'diario'|'semanal'|'mensual', email: string) {
    return this.http.post<{ message: string }>(`${this.base}/export`, { tab, email });
  }
}
