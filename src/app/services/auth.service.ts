// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import jwt_decode from 'jwt-decode';
import { environment } from '../enviromets/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Backend auth
  private apiUrl = `${environment.apiUrl}/auth`;

  userName: string = '';
  currentUser: any = null;

  constructor(private http: HttpClient) {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        this.setCurrentUser(token);
      }
    }
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password });
  }

  register(
    nombre: string,
    email: string,
    password: string,
    telefono: string,
    rol: string = 'user'
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, {
      nombre,
      email,
      password,
      telefono,
      rol
    });
  }

  saveToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      this.setCurrentUser(token);
    }
  }

  setCurrentUser(token: string) {
    try {
      const decoded: any = jwt_decode(token);

      this.userName = decoded.nombre || decoded.email || '';
      this.currentUser = decoded;

      // 👇 Muy importante para History / WhatsApp / Reports
      if (typeof window !== 'undefined') {
        if (decoded.id) {
          localStorage.setItem('userId', decoded.id.toString());
        }
        if (decoded.email) {
          localStorage.setItem('userEmail', decoded.email);
        }
        if (decoded.telefono) {
          localStorage.setItem('userPhone', decoded.telefono.toString());
        }
      }
    } catch (e) {
      this.userName = '';
      this.currentUser = null;
    }
  }

  getNombre(): string {
    return this.userName || '';
  }

  getEmail(): string {
    if (this.currentUser && this.currentUser.email) {
      return this.currentUser.email;
    }
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwt_decode(token);
        return decoded.email || '';
      } catch {
        return '';
      }
    }
    return '';
  }

  getTelefono(): string {
    if (this.currentUser && this.currentUser.telefono) {
      return this.currentUser.telefono;
    }
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwt_decode(token);
        return decoded.telefono || '';
      } catch {
        return '';
      }
    }
    return '';
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userPhone');
    }
    this.userName = '';
    this.currentUser = null;
  }
}
