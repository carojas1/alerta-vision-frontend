// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { environment } from '../enviromets/environment';

// Firebase imports
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile
} from 'firebase/auth';

// Inicializar Firebase
const app = initializeApp(environment.firebase);
const auth = getAuth(app);

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  userName: string = '';
  userEmail: string = '';
  currentUser: User | null = null;

  constructor(private http: HttpClient) {
    // Escuchar cambios de autenticación
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.currentUser = user;
        this.userName = user.displayName || user.email?.split('@')[0] || '';
        this.userEmail = user.email || '';

        // Guardar datos en localStorage
        const token = await user.getIdToken();
        this.saveUserData(user, token);

        console.log('✅ Usuario autenticado:', this.userEmail);
      } else {
        this.currentUser = null;
        this.userName = '';
        this.userEmail = '';
        console.log('❌ Usuario no autenticado');
      }
    });
  }

  // ==========================================
  // LOGIN CON EMAIL/PASSWORD
  // ==========================================
  loginWithEmail(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(auth, email, password)).pipe(
      switchMap(async (result) => {
        const user = result.user;
        const token = await user.getIdToken();

        // Sincronizar con backend
        return this.syncUserWithBackend(user, token).toPromise();
      }),
      tap((response) => {
        console.log('✅ Login exitoso');
      }),
      catchError((error) => {
        console.error('❌ Error login:', error);
        throw this.translateFirebaseError(error.code);
      })
    );
  }

  // ==========================================
  // REGISTRO CON EMAIL/PASSWORD
  // ==========================================
  registerWithEmail(
    nombre: string,
    email: string,
    password: string,
    telefono: string
  ): Observable<any> {
    return from(createUserWithEmailAndPassword(auth, email, password)).pipe(
      switchMap(async (result) => {
        const user = result.user;

        // Actualizar perfil con nombre
        await updateProfile(user, { displayName: nombre });

        const token = await user.getIdToken();

        // Registrar en backend
        return this.registerUserInBackend(user, nombre, telefono, token).toPromise();
      }),
      tap((response) => {
        console.log('✅ Registro exitoso');
      }),
      catchError((error) => {
        console.error('❌ Error registro:', error);
        throw this.translateFirebaseError(error.code);
      })
    );
  }

  // ==========================================
  // LOGIN CON GOOGLE
  // ==========================================
  loginWithGoogle(): Observable<any> {
    const provider = new GoogleAuthProvider();

    return from(signInWithPopup(auth, provider)).pipe(
      switchMap(async (result) => {
        const user = result.user;
        const token = await user.getIdToken();

        // Sincronizar con backend
        return this.syncUserWithBackend(user, token).toPromise();
      }),
      tap((response) => {
        console.log('✅ Login con Google exitoso');
      }),
      catchError((error) => {
        console.error('❌ Error Google login:', error);
        throw this.translateFirebaseError(error.code);
      })
    );
  }

  // ==========================================
  // LOGOUT
  // ==========================================
  logout(): Observable<void> {
    return from(signOut(auth)).pipe(
      tap(() => {
        if (typeof window !== 'undefined') {
          localStorage.clear();
        }
        this.userName = '';
        this.userEmail = '';
        this.currentUser = null;
        console.log('✅ Logout exitoso');
      })
    );
  }

  // ==========================================
  // OBTENER TOKEN ACTUAL
  // ==========================================
  async getIdToken(): Promise<string | null> {
    if (this.currentUser) {
      return await this.currentUser.getIdToken();
    }
    return localStorage.getItem('token');
  }

  // ==========================================
  // HELPERS
  // ==========================================
  private saveUserData(user: User, token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('userEmail', user.email || '');
      localStorage.setItem('userName', user.displayName || user.email?.split('@')[0] || '');
      localStorage.setItem('firebaseUid', user.uid);
    }
  }

  private syncUserWithBackend(user: User, token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/firebase-sync`, {
      firebaseUid: user.uid,
      email: user.email,
      nombre: user.displayName || user.email?.split('@')[0],
    }, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      tap((response: any) => {
        if (response.user?.id) {
          localStorage.setItem('userId', response.user.id.toString());
        }
        this.saveUserData(user, token);
      }),
      catchError((error) => {
        console.warn('⚠️ Backend sync failed, continuing with Firebase data');
        this.saveUserData(user, token);
        return of({ user: { email: user.email } });
      })
    );
  }

  private registerUserInBackend(
    user: User,
    nombre: string,
    telefono: string,
    token: string
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/firebase-register`, {
      firebaseUid: user.uid,
      email: user.email,
      nombre: nombre,
      telefono: telefono,
    }, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      tap((response: any) => {
        if (response.user?.id) {
          localStorage.setItem('userId', response.user.id.toString());
        }
        if (telefono) {
          localStorage.setItem('userPhone', telefono);
        }
        this.saveUserData(user, token);
      }),
      catchError((error) => {
        console.warn('⚠️ Backend register failed, continuing with Firebase');
        this.saveUserData(user, token);
        return of({ user: { email: user.email } });
      })
    );
  }

  private translateFirebaseError(code: string): string {
    const errors: Record<string, string> = {
      'auth/invalid-email': 'Correo electrónico inválido',
      'auth/user-disabled': 'Usuario deshabilitado',
      'auth/user-not-found': 'Usuario no encontrado',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/email-already-in-use': 'Este correo ya está registrado',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
      'auth/popup-closed-by-user': 'Ventana cerrada por el usuario',
      'auth/network-request-failed': 'Error de conexión',
    };
    return errors[code] || 'Error de autenticación';
  }

  // ==========================================
  // GETTERS (compatibilidad con código existente)
  // ==========================================
  getNombre(): string {
    return this.userName || localStorage.getItem('userName') || '';
  }

  getEmail(): string {
    return this.userEmail || localStorage.getItem('userEmail') || '';
  }

  getTelefono(): string {
    return localStorage.getItem('userPhone') || '';
  }

  isLoggedIn(): boolean {
    return !!this.currentUser || !!localStorage.getItem('token');
  }
}
