// =============================================
// 🚗 ALERTA VISION - ESP32-C3 SUPERMINI
// VERSION: ULTRA ROBUSTO - NUNCA FALLA
// Usuario ID: 5 (andres2007benavides@gmail.com)
// =============================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// ==========================================
// 📶 CONFIGURACIÓN WIFI
// ==========================================
// Tu red WiFi (hotspot móvil)
const char* WIFI_SSID     = "ANDRES 4607";
const char* WIFI_PASSWORD = "12345678";

// ==========================================
// 🌐 SERVIDOR BACKEND
// ==========================================
const char* BACKEND_URL = "https://alerta-vision-backend.onrender.com/alerts/esp32";

// ⚠️ ID DEL USUARIO EN LA BASE DE DATOS
// ID 5 = andres2007benavides@gmail.com
const int USUARIO_ID = 5;
const char* USUARIO_EMAIL = "andres2007benavides@gmail.com";

// ==========================================
// ⚙️ PINES (según tu diagrama)
// ==========================================
#define PIN_SENSOR    5    // GPIO5 = Sensor IR
#define PIN_BUZZER    3    // GPIO3 = Buzzer
#define PIN_VIBRADOR  4    // GPIO4 = Motor vibrador (BC547)

// ==========================================
// ⏱️ TIEMPOS
// ==========================================
#define TIEMPO_FILTRO         100    // Anti-rebote (ms)
#define TIEMPO_PARPADEO_LARGO 2000   // 2 segundos = parpadeo largo
#define VENTANA_TIEMPO        30000  // 30 segundos para acumular 2 parpadeos

// ==========================================
// 🔄 CONFIGURACIÓN DE REINTENTOS
// ==========================================
#define MAX_REINTENTOS_WIFI    20    // Más reintentos para WiFi
#define MAX_REINTENTOS_HTTP    5     // Reintentos HTTP
#define DELAY_REINTENTO_HTTP   2000  // 2 segundos entre reintentos
#define INTERVALO_RECONEXION   5000  // 5 segundos entre reconexiones

// ==========================================
// 🧠 VARIABLES
// ==========================================
int lecturaAnterior = HIGH;
int estadoEstable = HIGH;
unsigned long tiempoUltimoCambio = 0;

bool ojoCerrado = false;
unsigned long tiempoInicioCierre = 0;

int contadorParpadosLargos = 0;
unsigned long tiempoPrimerParpadeo = 0;

bool alarmaActiva = false;
unsigned long tiempoInicioAlarma = 0;

bool wifiConectado = false;
unsigned long ultimoIntentoWifi = 0;
int alertasPendientes = 0;

// ==========================================
// 📡 CONECTAR WIFI (MEJORADO)
// ==========================================
bool conectarWiFi() {
  Serial.println();
  Serial.println("╔════════════════════════════════════╗");
  Serial.println("║     📶 CONECTANDO A WIFI...        ║");
  Serial.println("╚════════════════════════════════════╝");
  Serial.print("Red: ");
  Serial.println(WIFI_SSID);
  
  // Desconectar primero
  WiFi.disconnect(true);
  delay(1000);
  
  // Configurar modo estación
  WiFi.mode(WIFI_STA);
  delay(100);
  
  // Intentar conectar
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < MAX_REINTENTOS_WIFI) {
    delay(500);
    Serial.print(".");
    intentos++;
    
    // Bip cada 4 intentos
    if (intentos % 4 == 0) {
      digitalWrite(PIN_BUZZER, HIGH);
      delay(50);
      digitalWrite(PIN_BUZZER, LOW);
    }
    
    // Si lleva mucho tiempo, reintentar
    if (intentos == 10) {
      Serial.println();
      Serial.println("⚠️ Reintentando conexión...");
      WiFi.disconnect();
      delay(500);
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    }
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("✅ ¡WIFI CONECTADO!");
    Serial.print("📍 IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("📶 Señal: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    wifiConectado = true;
    
    // 3 bips de éxito
    for (int i = 0; i < 3; i++) {
      digitalWrite(PIN_BUZZER, HIGH);
      delay(100);
      digitalWrite(PIN_BUZZER, LOW);
      delay(100);
    }
    
    return true;
  }
  
  Serial.println();
  Serial.println("❌ WiFi FALLÓ");
  Serial.println("📋 Posibles causas:");
  Serial.println("   - Verifica que el hotspot esté activo");
  Serial.println("   - Acerca el ESP32 al teléfono");
  Serial.println("   - Reinicia el hotspot");
  wifiConectado = false;
  
  // Bip largo de error
  digitalWrite(PIN_BUZZER, HIGH);
  delay(500);
  digitalWrite(PIN_BUZZER, LOW);
  
  return false;
}

// ==========================================
// 🔄 VERIFICAR Y RECONECTAR WIFI
// ==========================================
void verificarWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    if (!wifiConectado) {
      Serial.println("✅ WiFi reconectado automáticamente");
    }
    wifiConectado = true;
    return;
  }
  
  wifiConectado = false;
  unsigned long ahora = millis();
  
  if (ahora - ultimoIntentoWifi > INTERVALO_RECONEXION) {
    Serial.println("⚠️ WiFi desconectado, reconectando...");
    conectarWiFi();
    ultimoIntentoWifi = ahora;
  }
}

// ==========================================
// 🚀 ENVIAR ALERTA (CON REINTENTOS)
// ==========================================
bool enviarAlerta() {
  if (!wifiConectado) {
    Serial.println("⚠️ Sin WiFi - Alerta guardada");
    alertasPendientes++;
    return false;
  }

  Serial.println();
  Serial.println("🚨🚨🚨 ENVIANDO ALERTA 🚨🚨🚨");
  Serial.print("📧 Usuario ID: ");
  Serial.println(USUARIO_ID);
  Serial.print("📧 Email: ");
  Serial.println(USUARIO_EMAIL);
  Serial.println("⏳ Render puede tardar 50s en despertar...");

  for (int intento = 1; intento <= MAX_REINTENTOS_HTTP; intento++) {
    Serial.print("📤 Intento ");
    Serial.print(intento);
    Serial.print("/");
    Serial.println(MAX_REINTENTOS_HTTP);

    WiFiClientSecure cliente;
    cliente.setInsecure();
    cliente.setTimeout(60000);  // 60 segundos para Render cold start
    
    HTTPClient http;
    http.setTimeout(60000);  // 60 segundos timeout
    http.setConnectTimeout(30000);  // 30 segundos para conectar
    
    if (http.begin(cliente, BACKEND_URL)) {
      http.addHeader("Content-Type", "application/json");

      // JSON con ID del usuario
      String json = "{";
      json += "\"nivelFatiga\":10,";
      json += "\"tipo_alerta\":\"microsueno\",";
      json += "\"mensaje\":\"Microsueno detectado - 2 parpadeos largos\",";
      json += "\"usuarioId\":" + String(USUARIO_ID) + ",";
      json += "\"email\":\"" + String(USUARIO_EMAIL) + "\"";
      json += "}";

      Serial.println("📋 Enviando...");

      int codigo = http.POST(json);
      String respuesta = http.getString();
      
      http.end();

      Serial.print("📥 Código: ");
      Serial.println(codigo);
      
      // Código negativo = error de conexión
      if (codigo < 0) {
        Serial.print("⚠️ Error de conexión: ");
        switch(codigo) {
          case -1: Serial.println("Conexión fallida"); break;
          case -2: Serial.println("Error de envío"); break;
          case -3: Serial.println("Error de lectura"); break;
          case -4: Serial.println("Sin conexión"); break;
          case -5: Serial.println("Sin HTTP server"); break;
          case -11: Serial.println("Timeout (servidor tardó mucho)"); break;
          default: Serial.println("Error desconocido");
        }
        Serial.println("💡 El servidor puede estar despertando...");
      }
      else if (codigo == 200 || codigo == 201) {
        Serial.println();
        Serial.println("✅✅✅ ¡ALERTA ENVIADA! ✅✅✅");
        Serial.println("📱 Revisa la app para ver la alerta");
        
        // Bips de confirmación
        for (int i = 0; i < 2; i++) {
          digitalWrite(PIN_BUZZER, HIGH);
          delay(150);
          digitalWrite(PIN_BUZZER, LOW);
          delay(150);
        }
        
        alertasPendientes = 0;
        return true;
      } else {
        Serial.print("❌ Error HTTP: ");
        Serial.println(respuesta);
      }
    } else {
      Serial.println("❌ No se pudo iniciar HTTP");
    }

    if (intento < MAX_REINTENTOS_HTTP) {
      Serial.println("⏳ Esperando 5 segundos...");
      delay(5000);  // 5 segundos entre reintentos
    }
  }

  Serial.println("❌ No se pudo enviar después de todos los intentos");
  Serial.println("💡 Tip: Abre la app una vez para 'despertar' el servidor");
  alertasPendientes++;
  return false;
}

// ==========================================
// 🔔 CONTROL DE ALARMA
// ==========================================
void activarAlarma() {
  digitalWrite(PIN_BUZZER, HIGH);
  digitalWrite(PIN_VIBRADOR, HIGH);
}

void desactivarAlarma() {
  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(PIN_VIBRADOR, LOW);
}

// ==========================================
// 🏁 SETUP
// ==========================================
void setup() {
  delay(1000);
  Serial.begin(115200);
  while (!Serial) delay(10);
  delay(500);

  Serial.println();
  Serial.println("╔══════════════════════════════════════════╗");
  Serial.println("║    🚗 ALERTA VISION - ULTRA ROBUSTO      ║");
  Serial.println("║    👤 Usuario ID: 5                      ║");
  Serial.println("║    📧 andres2007benavides@gmail.com      ║");
  Serial.println("║    📶 Red: ANDRES 4607                   ║");
  Serial.println("╚══════════════════════════════════════════╝");
  Serial.println();

  // Configurar pines
  pinMode(PIN_SENSOR, INPUT_PULLUP);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_VIBRADOR, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(PIN_VIBRADOR, LOW);

  // Inicializar sensor
  lecturaAnterior = digitalRead(PIN_SENSOR);
  estadoEstable = lecturaAnterior;
  tiempoUltimoCambio = millis();

  Serial.print("👁️ Sensor: ");
  Serial.println(estadoEstable == LOW ? "CERRADO" : "ABIERTO");

  // Conectar WiFi
  conectarWiFi();

  Serial.println();
  Serial.println("═══════════════════════════════════════════");
  Serial.println("✅ SISTEMA LISTO - MONITOREANDO PARPADEOS");
  Serial.println("📋 2 parpadeos largos (>2s) en 30s = ALARMA");
  Serial.println("═══════════════════════════════════════════");
  Serial.println();
}

// ==========================================
// 🔄 LOOP PRINCIPAL
// ==========================================
void loop() {
  unsigned long ahora = millis();
  int lectura = digitalRead(PIN_SENSOR);

  // Verificar WiFi constantemente
  verificarWiFi();

  // Anti-rebote
  if (lectura != lecturaAnterior) {
    lecturaAnterior = lectura;
    tiempoUltimoCambio = ahora;
  }

  // Procesar cambio de estado
  if (lectura != estadoEstable && (ahora - tiempoUltimoCambio) >= TIEMPO_FILTRO) {
    int anterior = estadoEstable;
    estadoEstable = lectura;

    bool cerradoAntes = (anterior == LOW);
    bool cerradoAhora = (estadoEstable == LOW);

    // OJO SE CERRÓ
    if (!cerradoAntes && cerradoAhora) {
      ojoCerrado = true;
      tiempoInicioCierre = ahora;
      Serial.println("👁️ >>> OJO CERRADO");
    }

    // OJO SE ABRIÓ
    if (cerradoAntes && !cerradoAhora && ojoCerrado) {
      unsigned long duracion = ahora - tiempoInicioCierre;
      ojoCerrado = false;

      Serial.print("👁️ >>> OJO ABIERTO - ");
      Serial.print(duracion);
      Serial.println(" ms");

      // ¿Parpadeo LARGO?
      if (duracion >= TIEMPO_PARPADEO_LARGO) {
        Serial.println("⚡ ¡PARPADEO LARGO!");

        // Reiniciar si pasó la ventana
        if (contadorParpadosLargos > 0 && (ahora - tiempoPrimerParpadeo > VENTANA_TIEMPO)) {
          Serial.println("⏰ Ventana expirada");
          contadorParpadosLargos = 0;
        }

        if (contadorParpadosLargos == 0) {
          tiempoPrimerParpadeo = ahora;
        }

        contadorParpadosLargos++;

        // Bip de confirmación
        digitalWrite(PIN_BUZZER, HIGH);
        delay(200);
        digitalWrite(PIN_BUZZER, LOW);

        Serial.print("📊 Contador: ");
        Serial.print(contadorParpadosLargos);
        Serial.println("/2");

        // ¿2 parpadeos?
        if (contadorParpadosLargos >= 2 && !alarmaActiva) {
          Serial.println();
          Serial.println("🚨🚨🚨 ¡ALARMA ACTIVADA! 🚨🚨🚨");
          Serial.println();
          
          alarmaActiva = true;
          tiempoInicioAlarma = ahora;
          contadorParpadosLargos = 0;
          
          enviarAlerta();
        }
      }
    }
  }

  // Control de alarma
  if (alarmaActiva) {
    if ((ahora / 200) % 2 == 0) {
      activarAlarma();
    } else {
      desactivarAlarma();
    }

    // Auto-apagar 30 segundos
    if (ahora - tiempoInicioAlarma > 30000) {
      Serial.println("⏹️ Alarma apagada");
      alarmaActiva = false;
      desactivarAlarma();
    }
  } else {
    desactivarAlarma();
  }

  delay(10);
}
