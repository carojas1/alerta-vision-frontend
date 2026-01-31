# ✅ CHECKLIST FINAL DE PRODUCCIÓN

## 📋 Pre-Despliegue (Completado)

### Archivos de Configuración
- [x] ✅ `environment.ts` - Configurado con URL del backend de Render
- [x] ✅ `environment.prod.ts` - Configurado con URL del backend de Render
- [x] ✅ `auth.interceptor.ts` - Corregido (eliminada URL hardcodeada de localhost)
- [x] ✅ `vercel.json` - Creado para manejo de rutas SPA
- [x] ✅ Build local exitoso (sin errores)

### Output del Build
- [x] ✅ Directorio: `dist/auth-frontend/browser/` creado correctamente
- [x] ✅ Archivos generados: `index.html`, `main-*.js`, `polyfills-*.js`, `styles-*.css`
- [x] ✅ Sin errores de TypeScript
- [x] ✅ Build Command verificado: `npm run build`

### Servicios
- [x] ✅ `auth.service.ts` - Usa `environment.apiUrl` correctamente
- [x] ✅ `alert.service.ts` - Usa `environment.apiUrl` correctamente
- [x] ✅ `reports.service.ts` - Usa `environment.apiUrl` correctamente
- [x] ✅ `user.service.ts` - Usa `environment.apiUrl` correctamente

---

## 🚀 Despliegue en Vercel (Pendiente - Usuario)

### Paso 1: Subir a GitHub
- [ ] Código en Git (init + commit)
- [ ] Repositorio creado en GitHub
- [ ] Push a rama `main`

### Paso 2: Configurar Vercel
- [ ] Cuenta creada en Vercel (https://vercel.com)
- [ ] Repositorio importado
- [ ] Framework Preset: **Angular**
- [ ] Build Command: **`npm run build`**
- [ ] Output Directory: **`dist/auth-frontend/browser`**
- [ ] Install Command: **`npm install`**
- [ ] Click en **Deploy**

### Paso 3: Obtener URL de Vercel
- [ ] Deployment completado
- [ ] URL obtenida (ej: `https://alerta-vision-frontend.vercel.app`)

---

## 🔧 Configuración Backend en Render (Pendiente - Usuario)

### Actualizar CORS en Backend
- [ ] Abrir proyecto backend (NestJS)
- [ ] Editar archivo `main.ts`
- [ ] Copiar configuración de `BACKEND_CORS_CONFIG.ts`
- [ ] Reemplazar `'https://your-app-name.vercel.app'` con URL real de Vercel
- [ ] Commit y push al repositorio del backend
- [ ] Esperar auto-deploy en Render (~2 minutos)

### Verificar CORS Configurado
```typescript
origin: [
  'http://localhost:4200',
  'https://tu-url-real.vercel.app',  // ← URL obtenida en Paso 2
  'https://*.vercel.app',
],
methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
credentials: true,
```

---

## 🧪 Testing en Producción (Pendiente - Usuario)

### Test 1: Acceso a la App
- [ ] Visitar URL de Vercel
- [ ] Página de login carga correctamente
- [ ] Sin errores 404
- [ ] Sin errores en consola (F12)

### Test 2: Login
- [ ] Abrir DevTools (F12) → Console + Network
- [ ] Ingresar credenciales válidas
- [ ] Petición a `https://alerta-vision-backend.onrender.com/auth/login`
- [ ] Status 200 recibido
- [ ] Token guardado en localStorage
- [ ] Sin errores CORS en consola
- [ ] Redirección exitosa a dashboard/home

### Test 3: Authorization Header
- [ ] Estar logueado
- [ ] Navegar a `/home` o `/reports`
- [ ] DevTools → Network → Ver request headers
- [ ] Verificar header: `Authorization: Bearer <token>`

### Test 4: Rutas Protegidas
- [ ] Sin login, intentar acceder a `/profile`
- [ ] Debe redirigir a `/login`
- [ ] Hacer login exitoso
- [ ] Navegar a `/profile`
- [ ] Debe cargar correctamente
- [ ] Navegar a `/home`
- [ ] Debe cargar correctamente
- [ ] Navegar a `/reports`
- [ ] Debe cargar correctamente

### Test 5: Refresh de Página (SPA Routing)
- [ ] Estar en `/home`
- [ ] Presionar F5 (refresh)
- [ ] Debe seguir en `/home` (NO error 404)
- [ ] Navegar a `/reports`
- [ ] Copiar URL completa
- [ ] Abrir en nueva pestaña
- [ ] Debe cargar `/reports` correctamente (NO error 404)

### Test 6: Logout y Guard
- [ ] Hacer logout
- [ ] LocalStorage debe limpiarse (token, userId, userEmail, userPhone)
- [ ] Intentar navegar a `/home` (URL manual)
- [ ] Debe redirigir automáticamente a `/login`

### Test 7: Manejo de Errores 401/403
- [ ] Hacer login
- [ ] Modificar token en localStorage a valor inválido
- [ ] Navegar a `/home`
- [ ] Backend debe retornar 401
- [ ] App debe limpiar localStorage y redirigir a `/login`

---

## 🔍 Verificación de Seguridad

### Headers y Configuración
- [ ] HTTPS habilitado en Vercel (automático)
- [ ] No hay warnings de seguridad en consola
- [ ] Tokens no se exponen en URLs
- [ ] Backend valida tokens correctamente
- [ ] LocalStorage se limpia en logout

### CORS
- [ ] No hay errores CORS en consola
- [ ] Peticiones OPTIONS retornan 204
- [ ] Response headers incluyen:
  - `Access-Control-Allow-Origin: https://tu-app.vercel.app`
  - `Access-Control-Allow-Credentials: true`

---

## 📊 Performance y Monitoring (Opcional)

### Lighthouse Score
- [ ] Ejecutar Lighthouse en DevTools
- [ ] Performance: >80
- [ ] Best Practices: >90
- [ ] SEO: >80

### Runtime Monitoring
- [ ] Configurar Vercel Analytics (opcional)
- [ ] Configurar Sentry para tracking de errores (opcional)
- [ ] Verificar logs en Vercel Dashboard

---

## ⚠️ Puntos Críticos a Vigilar

### Cold Starts de Render
- [ ] Backend puede tardar hasta 30 segundos en "despertar"
- [ ] Considerar upgrade a plan de pago ($7/mes)
- [ ] O implementar keep-alive pings

### Cache de Vercel
- [ ] Si hay cambios y no se reflejan, hacer "hard refresh" (Ctrl+Shift+R)
- [ ] O limpiar cache del navegador

### Dominio Personalizado (Opcional)
- [ ] Si usas dominio custom, agregarlo a CORS del backend
- [ ] Configurar DNS según instrucciones de Vercel

---

## 📝 Archivos de Referencia Creados

1. **`vercel.json`** - Configuración de routing para Vercel
2. **`BACKEND_CORS_CONFIG.ts`** - Template de CORS para NestJS
3. **`VERCEL_DEPLOYMENT_GUIDE.md`** - Guía completa paso a paso
4. **`PRODUCTION_CHECKLIST.md`** - Este archivo

---

## 🎯 Resumen de URLs

### Frontend
- **Desarrollo:** http://localhost:4200
- **Producción:** https://[tu-app].vercel.app (pendiente de despliegue)

### Backend
- **Producción:** https://alerta-vision-backend.onrender.com ✅

---

## 🚨 Si Algo Sale Mal

### Error: Build Failed
1. Ver logs en Vercel Dashboard → Deployments → Build Logs
2. Verificar que Output Directory sea correcto
3. Intentar build local: `npm run build`

### Error: CORS Blocked
1. Verificar que backend tenga CORS configurado
2. Verificar que URL de Vercel esté en lista `origin`
3. Verificar que backend esté redespleado después de cambios
4. Ver logs del backend en Render

### Error: 404 en Rutas
1. Verificar que `vercel.json` exista en raíz
2. Verificar contenido de `vercel.json`
3. Trigger redeploy en Vercel

### Error: Token no se adjunta
1. Verificar `auth.interceptor.ts`
2. Verificar que esté registrado en `app.config.ts`
3. Ver Network → Request Headers en DevTools

---

## ✅ Confirmación Final

Cuando todos los checkboxes estén marcados:

**Tu aplicación estará 100% funcional en producción** 🎉

### Última Verificación
- [ ] Login funciona ✅
- [ ] Rutas protegidas funcionan ✅
- [ ] Refresh en SPA no da 404 ✅
- [ ] No hay errores CORS ✅
- [ ] Authorization headers se envían ✅
- [ ] Logout limpia datos ✅

---

## 📞 Soporte

Si necesitas ayuda:
1. Ver `VERCEL_DEPLOYMENT_GUIDE.md` para troubleshooting detallado
2. Ver logs en Vercel Dashboard
3. Ver logs en Render Dashboard
4. Verificar Network tab en DevTools

---

**Deployment preparado por:** Antigravity AI
**Fecha:** 2025-12-19
**Status:** ✅ LISTO PARA DESPLEGAR
