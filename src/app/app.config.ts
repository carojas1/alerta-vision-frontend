import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http'; // Importa withFetch
import { provideRouter } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { routes } from './app.routes';

// ¡YA NO IMPORTAMOS NADA DE ANIMATIONS!

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(BrowserModule, FormsModule, ReactiveFormsModule),
    provideHttpClient(withFetch()),     // Arregla el error NG02801 (fetch)
    provideRouter(routes),
    // ¡YA NO 'ENCENDEMOS' LAS ANIMACIONES!
  ],
};