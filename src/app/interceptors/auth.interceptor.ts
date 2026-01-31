import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

/**
 * Auth Interceptor for Angular Standalone
 * 
 * Este interceptor:
 * 1. Adjunta el JWT token a todas las peticiones HTTP
 * 2. NO redirige automáticamente al login (eso lo manejan los componentes)
 */

// Helper: Detecta si la URL es un asset estático
const isAsset = (url: string) =>
  url.startsWith('/assets') ||
  /\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|map|woff2?)$/i.test(url);

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  // No adjuntar token a endpoints de autenticación ni a assets
  const isAuthEndpoint = /\/auth\/(login|register|refresh)/i.test(req.url);
  const skipAttach = isAsset(req.url) || isAuthEndpoint;

  // Clonar request y agregar Authorization header si hay token
  const request = (!skipAttach && token)
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  // Log para debug
  if (!skipAttach) {
    console.log('🔐 Request:', req.method, req.url);
    console.log('🔑 Token existe:', !!token);
  }

  return next(request).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        console.log('❌ Error HTTP:', err.status, err.url);
        
        // Solo redirigir al login si:
        // 1. Es error 401 (no autorizado)
        // 2. NO estamos en la página de login
        // 3. Es una petición a la API (no assets)
        if (err.status === 401 && !router.url.startsWith('/login') && !isAsset(err.url || '')) {
          console.log('🔄 Token expirado o inválido, redirigiendo a login...');
          
          // Limpiar datos de sesión
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userPhone');
          localStorage.removeItem('nombre');
          localStorage.removeItem('email');
          localStorage.removeItem('role');
          localStorage.removeItem('telefono');

          // Redirigir a login
          router.navigateByUrl('/login');
        }
        
        // Para error 403 (forbidden) solo mostrar mensaje, no redirigir
        if (err.status === 403) {
          console.log('⛔ Acceso denegado (403)');
        }
      }
      return throwError(() => err);
    })
  );
};
