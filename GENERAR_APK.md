# 📱 Generar APK - Alerta Visión

## 🚀 Comandos Rápidos

### **Opción 1: Usando npm scripts**

```bash
# Generar APK de debug (para pruebas)
npm run apk:debug

# Generar APK de release (para producción)
npm run apk:release
```

### **Opción 2: Paso a paso manual**

```bash
# 1. Compilar Angular para producción
npm run build:prod

# 2. Sincronizar con Capacitor
npx cap sync android

# 3. Abrir Android Studio
npx cap open android

# 4. En Android Studio: Build > Build Bundle / APK > Build APK
```

---

## 📍 Ubicación del APK

Después de compilar, el APK estará en:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

O para release:

```
android/app/build/outputs/apk/release/app-release-unsigned.apk
```

---

## 🔔 Notificaciones

El servicio de notificaciones ya está creado en:

```
src/app/services/notification.service.ts
```

### **Usar en cualquier componente:**

```typescript
import { NotificationService } from '../../services/notification.service';

constructor(private notifications: NotificationService) {}

// Mostrar alerta de fatiga
this.notifications.alertaFatigaAlta();
this.notifications.alertaSomnolenciaCritica();
this.notifications.alertaParpadeoLento();
this.notifications.alertaDistraccion();

// Personalizado
this.notifications.showFatigaAlert('Tu mensaje aquí', 'warning');
```

---

## ⚙️ Requisitos

1. **Android Studio** instalado
2. **Java JDK 17+** instalado
3. Variables de entorno configuradas:
   - `ANDROID_HOME`
   - `JAVA_HOME`

---

## 🐛 Solución de problemas

### Error: "ANDROID_HOME not set"

```bash
# Windows (PowerShell)
$env:ANDROID_HOME = "C:\Users\TU_USUARIO\AppData\Local\Android\Sdk"
```

### Error: "gradlew not found"

```bash
cd android
chmod +x gradlew   # Linux/Mac
```

### Error de build

```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

---

## 📲 Instalar en dispositivo

```bash
# Conectar teléfono con USB debugging activado
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

O simplemente copia el archivo APK al teléfono y ábrelo para instalar.
