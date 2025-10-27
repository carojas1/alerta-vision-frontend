import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';


const API_BASE = 'http://localhost:3000';


const isApiUrl = (url: string) => {
  try {
    const u = new URL(url, window.location.origin);
    return u.origin + (u.port ? '' : '') === new URL(API_BASE).origin
           && u.href.startsWith(API_BASE);
  } catch {
    return false;
  }
};


const isAsset = (url: string) =>
  url.startsWith('/assets') ||
  /\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|map|woff2?)$/i.test(url);

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  const isAuthEndpoint = /\/auth\/(login|register|refresh)/i.test(req.url);
  const skipAttach = isAsset(req.url) || isAuthEndpoint;

  const request = (!skipAttach && token)
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(request).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        const fromApi = isApiUrl(req.url);
        if ((err.status === 401 || err.status === 403) && fromApi) {
          localStorage.removeItem('token');
          if (!router.url.startsWith('/login')) router.navigateByUrl('/login');
        }
      }
      return throwError(() => err);
    })
  );
};
