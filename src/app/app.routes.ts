import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

const AuthGuard = () => {
  const token = localStorage.getItem('token');
  const router = inject(Router);
  if (token) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent }, // <-- ruta de registro
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: 'login' }
];
