import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviromets/environment';

export interface SeriesResponse {
  labels: string[];
  values: number[];
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private base = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  private buildParams(from: string, to: string, userId?: string): HttpParams {
    let p = new HttpParams().set('from', from).set('to', to);
    if (userId) {
      p = p.set('userId', userId);
    }
    return p;
  }

  getDaily(from: string, to: string, userId?: string): Observable<SeriesResponse> {
    return this.http.get<SeriesResponse>(`${this.base}/daily`, {
      params: this.buildParams(from, to, userId)
    });
  }

  getWeekly(from: string, to: string, userId?: string): Observable<SeriesResponse> {
    return this.http.get<SeriesResponse>(`${this.base}/weekly`, {
      params: this.buildParams(from, to, userId)
    });
  }

  getMonthly(from: string, to: string, userId?: string): Observable<SeriesResponse> {
    return this.http.get<SeriesResponse>(`${this.base}/monthly`, {
      params: this.buildParams(from, to, userId)
    });
  }

  exportarPorCorreo(tab: string, email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/export`, {
      tab,
      email
    });
  }
}
