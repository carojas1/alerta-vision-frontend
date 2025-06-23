import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private API_URL = 'http://localhost:3000'; // Cambia si usas Railway u otra cosa

  constructor(private http: HttpClient) {}

  register(nombre: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/register`, { nombre, email, password });
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/login`, { email, password });
  }

  getProfile(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.API_URL}/users/me`, { headers });
  }

  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
  }
}