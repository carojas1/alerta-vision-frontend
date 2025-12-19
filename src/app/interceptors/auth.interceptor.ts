import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

/**
 * Auth Interceptor for Angular Standalone
 * 
 * Este interceptor:
 * 1. Adjunta el JWT token a todas las peticiones HTTP (excepto assets y endpoints de auth)
 * 2. Maneja errores 401/403 redirigiendo al usuario al login
 * 3. Funciona correctamente en desarrollo y producción
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

  return next(request).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        // Si es error de autenticación o autorización, limpiar token y redirigir
        if (err.status === 401 || err.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userPhone');

          // Redirigir a login solo si no estamos ya ahí
          if (!router.url.startsWith('/login')) {
            router.navigateByUrl('/login');
          }
        }
      }
      return throwError(() => err);
    })
  );
};
