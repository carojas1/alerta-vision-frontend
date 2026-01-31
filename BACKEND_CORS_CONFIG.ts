/**
 * CONFIGURACIÓN CORS PARA NESTJS BACKEND EN RENDER
 * 
 * Archivo: main.ts (en tu backend NestJS)
 * 
 * Esta configuración permite que tu frontend en Vercel se conecte
 * correctamente con tu backend en Render.
 * 
 * INSTRUCCIONES:
 * 1. Copia todo el código de la función bootstrap() 
 * 2. Pega en tu archivo main.ts (reemplazando la función existente)
 * 3. Actualiza la URL de Vercel con tu dominio real después del primer deploy
 * 4. Redesplega tu backend en Render
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // ═══════════════════════════════════════════════════════════
    // 🔹 CONFIGURACIÓN CORS PARA VERCEL
    // ═══════════════════════════════════════════════════════════
    app.enableCors({
        // Lista de orígenes permitidos
        origin: [
            'http://localhost:4200',                    // ← Desarrollo local Angular
            'http://localhost:3000',                    // ← Desarrollo local alternativo
            'https://your-app-name.vercel.app',         // ← 🚨 CAMBIAR con tu URL de Vercel
            'https://*.vercel.app',                     // ← Todos los preview deployments de Vercel
        ],

        // Métodos HTTP permitidos
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

        // Headers permitidos (importante: incluir Authorization para JWT)
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'Accept',
            'Origin',
            'X-Requested-With'
        ],

        // Permitir envío de cookies y credentials
        credentials: true,

        // Caching de preflight requests (24 horas)
        maxAge: 86400,

        // No pasar la petición OPTIONS al siguiente handler
        preflightContinue: false,

        // Status code para OPTIONS exitoso
        optionsSuccessStatus: 204
    });

    // ═══════════════════════════════════════════════════════════
    // 🔹 HELMET - SEGURIDAD HEADERS
    // ═══════════════════════════════════════════════════════════
    app.use(helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        contentSecurityPolicy: false  // Desactivar si interfiere con tu app
    }));

    // ═══════════════════════════════════════════════════════════
    // 🔹 COOKIE PARSER
    // ═══════════════════════════════════════════════════════════
    app.use(cookieParser());

    // ═══════════════════════════════════════════════════════════
    // 🔹 GLOBAL PREFIX (Opcional)
    // ═══════════════════════════════════════════════════════════
    // Si usas /api como prefijo global, descomenta la siguiente línea:
    // app.setGlobalPrefix('api');

    // ═══════════════════════════════════════════════════════════
    // 🔹 PUERTO
    // ═══════════════════════════════════════════════════════════
    const port = process.env.PORT || 3000;
    await app.listen(port);

    console.log(`🚀 Backend running on port ${port}`);
    console.log(`🌐 CORS enabled for Vercel frontend`);
}

bootstrap();

/**
 * ═══════════════════════════════════════════════════════════
 * 📝 NOTAS IMPORTANTES:
 * ═══════════════════════════════════════════════════════════
 * 
 * 1️⃣ ACTUALIZAR URL DE VERCEL:
 *    Después de tu primer deploy en Vercel, obtén la URL exacta
 *    (ej: https://alerta-vision-frontend.vercel.app)
 *    y actualiza la línea:
 *    'https://your-app-name.vercel.app'
 * 
 * 2️⃣ WILDCARD VERCEL:
 *    'https://*.vercel.app' permite todos los preview deploys
 *    Si quieres más seguridad, especifica solo tu dominio exacto
 * 
 * 3️⃣ CREDENTIALS:
 *    credentials: true permite enviar cookies y headers de auth
 *    Tu frontend debe también usar withCredentials: true si envías cookies
 * 
 * 4️⃣ TESTING CORS:
 *    Puedes probar que CORS funciona abriendo DevTools → Network
 *    y verificando que las peticiones OPTIONS retornen 204
 *    y que las peticiones POST/GET tengan el header:
 *    Access-Control-Allow-Origin: https://tu-app.vercel.app
 * 
 * 5️⃣ TROUBLESHOOTING:
 *    Si ves errores CORS en consola:
 *    - Verifica que la URL del frontend esté en la lista 'origin'
 *    - Verifica que 'Authorization' esté en 'allowedHeaders'
 *    - Verifica que redesplegas el backend después de cambios
 * 
 * ═══════════════════════════════════════════════════════════
 */
