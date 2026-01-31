# 📋 GUÍA DE DESPLIEGUE: ANGULAR EN VERCEL

## Paso 1: Preparar Repositorio Git

### 1.1 Verificar que tu código esté en Git

```bash
# Si aún no has inicializado git:
git init

# Agregar todos los archivos
git add .

# Commit
git commit -m "feat: prepare for Vercel deployment"
```

### 1.2 Subir a GitHub/GitLab/Bitbucket

```bash
# Crear repositorio en GitHub y luego:
git remote add origin https://github.com/tu-usuario/alerta-vision-frontend.git
git branch -M main
git push -u origin main
```

---

## Paso 2: Configurar Vercel

### 2.1 Crear Cuenta en Vercel

1. Ir a: https://vercel.com
2. Sign up con tu cuenta de GitHub/GitLab/Bitbucket
3. Autorizar Vercel para acceder a tus repositorios

### 2.2 Importar Proyecto

1. Click en **"Add New Project"**
2. Click en **"Import Git Repository"**
3. Seleccionar tu repositorio `alerta-vision-frontend`
4. Click en **"Import"**

### 2.3 Configuración del Build

En la página de configuración, ingresa estos valores:

```
Framework Preset: Angular
Build Command: npm run build
Output Directory: dist/auth-frontend/browser
Install Command: npm install
Root Directory: ./
```

**IMPORTANTE:** El `Output Directory` debe coincidir exactamente con lo que está en tu `angular.json` (línea 16).

### 2.4 Variables de Entorno (Opcional)

**NO necesitas configurar variables de entorno** porque la URL del backend ya está en `environment.prod.ts`.

Si en el futuro quieres hacerlo dinámico:
- Click en **"Environment Variables"**
- Agregar: `NG_APP_API_URL` = `https://alerta-vision-backend.onrender.com`

### 2.5 Deploy

1. Click en **"Deploy"**
2. Esperar 2-5 minutos
3. Vercel te dará una URL como: `https://alerta-vision-frontend.vercel.app`

---

## Paso 3: Configurar CORS en Backend

### 3.1 Actualizar main.ts en tu Backend

1. Abrir tu proyecto backend (el que está en Render)
2. Editar el archivo `main.ts`
3. Copiar la configuración del archivo `BACKEND_CORS_CONFIG.ts` que se creó en tu frontend
4. **IMPORTANTE:** Reemplazar `'https://your-app-name.vercel.app'` con tu URL real de Vercel

Ejemplo:
```typescript
origin: [
  'http://localhost:4200',
  'https://alerta-vision-frontend.vercel.app',  // ← Tu URL real
  'https://*.vercel.app',
],
```

### 3.2 Commit y Push al Backend

```bash
# En tu repositorio del backend
git add .
git commit -m "feat: add CORS for Vercel frontend"
git push
```

### 3.3 Render Auto-Deploy

Render detectará el push y redespleará automáticamente el backend en ~2 minutos.

---

## Paso 4: Testing

### 4.1 Verificar Despliegue de Frontend

1. Visitar tu URL de Vercel: `https://tu-app.vercel.app`
2. Debería cargar la página de login
3. **NO** debería mostrar error 404

### 4.2 Test de Login

1. Abrir DevTools (F12) → Console
2. Ir a la pestaña Network
3. Intentar hacer login con credenciales válidas
4. Verificar en Network que la petición a:
   ```
   https://alerta-vision-backend.onrender.com/auth/login
   ```
   retorne status **200**
5. **NO** debería haber errores CORS en consola

**Ejemplo de petición exitosa:**
```
Request URL: https://alerta-vision-backend.onrender.com/auth/login
Request Method: POST
Status Code: 200
Response Headers:
  access-control-allow-origin: https://tu-app.vercel.app
```

### 4.3 Test de Rutas Protegidas

1. Hacer login exitoso
2. Verificar en DevTools → Application → Local Storage:
   - Debe existir `token`
   - Debe existir `userId`
3. Navegar a `/home`
4. Verificar que cargue correctamente
5. **Refrescar la página (F5)**
6. Debe seguir en `/home` (NO error 404) ← Gracias a `vercel.json`

### 4.4 Test de Authorization Header

1. Estar logueado
2. Navegar a `/reports` o cualquier ruta protegida
3. En DevTools → Network → Headers de la petición
4. Verificar que incluya:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 4.5 Test de Logout y Guard

1. Hacer logout
2. Intentar navegar manualmente a `/home` (escribir en URL)
3. Debe redirigir automáticamente a `/login` ← Gracias al AuthGuard

---

## Paso 5: Configuración de Dominio Personalizado (Opcional)

### 5.1 En Vercel Dashboard

1. Ir a tu proyecto
2. Click en **"Settings"** → **"Domains"**
3. Agregar tu dominio personalizado: `alertavision.com`
4. Seguir instrucciones de Vercel para configurar DNS

### 5.2 Actualizar CORS

Si usas dominio personalizado, actualizar `main.ts` del backend:

```typescript
origin: [
  'http://localhost:4200',
  'https://alerta-vision-frontend.vercel.app',
  'https://alertavision.com',              // ← Tu dominio
  'https://www.alertavision.com',          // ← Con www
],
```

---

## Comandos de Verificación Local (Pre-Deploy)

### Verificar Build Local

```bash
# En tu proyecto frontend
npm run build
```

**Output esperado:**
```
✔ Browser application bundle generation complete.
✔ Copying assets complete.
✔ Index html generation complete.

Initial Chunk Files | Names         |  Raw Size
main-XXXXXX.js      | main          |   XXX kB
polyfills-XXXX.js   | polyfills     |   XX kB
styles-XXXXX.css    | styles        |   XX kB

Output location: dist/auth-frontend/browser
```

### Preview Local del Build

```bash
# Instalar serve (solo una vez)
npm install -g serve

# Servir el build localmente
cd dist/auth-frontend/browser
serve -s . -p 8080
```

Luego abrir: http://localhost:8080

---

## Troubleshooting

### Error: "Build failed - output directory not found"

**Solución:**
- Verificar `angular.json` línea 16: `"outputPath": "dist/auth-frontend"`
- En Vercel, usar: `dist/auth-frontend/browser`

### Error CORS: "has been blocked by CORS policy"

**Solución:**
1. Verificar que el backend tenga configurado CORS con tu URL de Vercel
2. Verificar que `'Authorization'` esté en `allowedHeaders`
3. Redesplegar el backend después de cambios

### Error 404 al refrescar páginas

**Solución:**
- Verificar que existe `vercel.json` en la raíz del proyecto
- Verificar que tenga la configuración correcta de rutas

### Backend tarda mucho en responder (30+ segundos)

**Causa:** Cold start de Render (plan gratuito)

**Soluciones:**
1. Upgrade a plan de pago de Render ($7/mes)
2. Implementar keep-alive pings cada 10 minutos
3. Mostrar loading state en frontend

### Error: "localStorage is not defined"

**Causa:** Código ejecutándose en SSR

**Solución:**
- Ya implementado en tu código con checks `typeof window !== 'undefined'`
- Asegurar que `ssr: false` en `angular.json` (ya configurado)

---

## Logs y Monitoring

### Ver Logs de Deployment

1. En Vercel Dashboard → Tu proyecto
2. Click en **"Deployments"**
3. Click en el deployment específico
4. Ver **"Build Logs"** para errores

### Ver Runtime Logs

1. En Vercel Dashboard → Tu proyecto
2. Click en **"Logs"** (menú lateral)
3. Ver logs en tiempo real

### Ver Errores de Backend

1. En Render Dashboard → Tu servicio
2. Click en **"Logs"**
3. Filtrar por errores (status 4xx, 5xx)

---

## Redeploys

### Trigger Manual Redeploy

**Opción 1: Via Git**
```bash
git commit --allow-empty -m "trigger redeploy"
git push
```

**Opción 2: Via Vercel Dashboard**
1. Ir a **"Deployments"**
2. Click en los 3 puntos del último deployment
3. Click en **"Redeploy"**

### Auto-Deploy on Push

Vercel automáticamente redesplegea cuando haces push a la rama `main` (o la configurada).

---

## Configuración Avanzada

### Preview Deployments

Vercel crea automáticamente preview deployments para cada Pull Request.

**Deshabilitar preview deployments:**
1. Settings → Git → Deploy Hooks
2. Desactivar **"Deploy on Pull Request"**

### Build Optimizations

Agregar en `angular.json` para build de producción:

```json
"production": {
  "optimization": true,
  "outputHashing": "all",
  "sourceMap": false,
  "namedChunks": false,
  "extractLicenses": true,
  "vendorChunk": false,
  "buildOptimizer": true,
  "budgets": [
    {
      "type": "initial",
      "maximumWarning": "2mb",
      "maximumError": "5mb"
    }
  ]
}
```

---

## Siguiente Pasos Recomendados

1. ✅ **Monitoreo:** Configurar Sentry o LogRocket para tracking de errores
2. ✅ **Analytics:** Agregar Google Analytics o Vercel Analytics
3. ✅ **Performance:** Implementar lazy loading de módulos
4. ✅ **SEO:** Agregar meta tags en páginas públicas
5. ✅ **PWA:** Convertir a Progressive Web App con Service Workers
6. ✅ **Testing:** Agregar CI/CD con tests automáticos antes de deploy

---

## Recursos Adicionales

- **Vercel Docs:** https://vercel.com/docs
- **Angular Deployment:** https://angular.io/guide/deployment
- **Render CORS:** https://render.com/docs/cors
- **JWT Best Practices:** https://tools.ietf.org/html/rfc8725
