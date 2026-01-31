#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// ==========================================
// 📶 CONFIGURACIÓN WIFI Y SERVIDOR
// ==========================================
const char* ssid = "ANDRES 4607";          // ⬅️ CAMBIAR ESTO
const char* password = "12345678";    // ⬅️ CAMBIAR ESTO

// URL del Backend (Render)
// Nota: Si usas localhost, usa tu IP local (ej: http://192.168.1.15:10000/alerts)
const char* serverUrl = "https://alerta-vision-backend.onrender.com/alerts";

// Token falso si tu backend no exige Auth para el ESP32, 
// o el token real si implementas auth en el dispositivo. 
// Por ahora asumimos que el endpoint /alerts acepta requests sin token o lo manejas tú.
// Si necesitas token: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// ==========================================
// ⚙️ PINES Y CONFIGURACIÓN HARDWARE
// ==========================================
#define IR_PIN      5    // Sensor infrarrojo (Ojo)
#define BUZZER_PIN  3    // Transistor -> buzzer

// true  => LOW = ojo cerrado (común en sensores IR activos bajo)
// false => HIGH = ojo cerrado
const bool CLOSED_IS_LOW = true;

// TIEMPOS
const unsigned long STABLE_MS       = 80;     // Filtro anti-ruido (ms)
const unsigned long CLOSED_LONG_MS  = 2000;   // 2 segundos cerrado = MICROSUEÑO

// ESTADO INTERNO
int lastRaw = HIGH;
int stableState = HIGH;
unsigned long lastChangeMs = 0;

bool ojoCerrado = false;
unsigned long closedStartMs = 0;

// Evitar enviar alertas repetidas muy seguido
unsigned long lastAlertSentMs = 0;
const unsigned long ALERT_COOLDOWN_MS = 5000; // Esperar 5s entre envíos al servidor

// ==========================================
// 🛠️ FUNCIONES AUXILIARES
// ==========================================

// Determina si el ojo está cerrado según la configuración
inline bool isClosed(int level) {
  return CLOSED_IS_LOW ? (level == LOW) : (level == HIGH);
}

// Conectar al WiFi
void connectToWiFi() {
  Serial.print("📡 Conectando a WiFi");
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 20) {
    delay(500);
    Serial.print(".");
    digitalWrite(BUZZER_PIN, !digitalRead(BUZZER_PIN)); // Pequeño bip visual/sonoro
    delay(50);
    digitalWrite(BUZZER_PIN, LOW);
    intentos++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Conectado!");
    Serial.print("📍 IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ Falló la conexión WiFi. Trabajando en modo Offline.");
  }
}

// Enviar Alerta al Backend
void sendFatigueAlert(int nivel, String tipo, String mensaje) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ No hay WiFi. No se puede enviar alerta.");
    return;
  }

  // Prevenir spam de alertas
  if (millis() - lastAlertSentMs < ALERT_COOLDOWN_MS) {
    return; 
  }

  WiFiClientSecure client;
  client.setInsecure(); // ⚠️ Importante para HTTPS sin certificado raíz (desarrollo/tests)
  
  HTTPClient http;
  
  Serial.println("🚀 Enviando alerta al servidor...");
  
  // Iniciar conexión
  if (http.begin(client, serverUrl)) {
    http.addHeader("Content-Type", "application/json");

    // Construir JSON
    // El backend espera: { "nivelFatiga": X, "tipo_alerta": "Y", "mensaje": "Z", "usuarioId": 1 }
    // Asumimos usuario 1 por defecto si no hay login en el ESP32
    String jsonPayload = "{";
    jsonPayload += "\"nivelFatiga\": " + String(nivel) + ",";
    jsonPayload += "\"tipo_alerta\": \"" + tipo + "\",";
    jsonPayload += "\"mensaje\": \"" + mensaje + "\",";
    jsonPayload += "\"usuarioId\": 1"; // ⬅️ ID DE USUARIO (quemado para demo)
    jsonPayload += "}";

    Serial.print("📦 Payload: ");
    Serial.println(jsonPayload);

    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.print("✅ Respuesta Servidor (");
      Serial.print(httpResponseCode);
      Serial.print("): ");
      Serial.println(response);
      lastAlertSentMs = millis();
    } else {
      Serial.print("❌ Error enviando POST: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  } else {
    Serial.println("❌ No se pudo conectar al servidor.");
  }
}

// ==========================================
// 🏁 SETUP & LOOP
// ==========================================
void setup() {
  Serial.begin(115200);
  delay(3000); // 🕒 ESPERAR 3 SEGUNDOS para que te de tiempo de abrir el Monitor Serie

  Serial.println("\n\n\n"); // Espacio en blanco
  Serial.println("================================");
  Serial.println("� INICIANDO ESP32 ALERTA VISION");
  Serial.println("================================");

  // Configurar Pines
  pinMode(IR_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // Estado Inicial
  lastRaw = digitalRead(IR_PIN);
  stableState = lastRaw;
  lastChangeMs = millis();

  // Conectar a internet
  connectToWiFi();

  // Sonido de inicio (Bip-Bip)
  digitalWrite(BUZZER_PIN, HIGH); delay(100);
  digitalWrite(BUZZER_PIN, LOW); delay(100);
  digitalWrite(BUZZER_PIN, HIGH); delay(100);
  digitalWrite(BUZZER_PIN, LOW);
}

void loop() {
  unsigned long now = millis();
  int raw = digitalRead(IR_PIN);

  // 1. Filtrado de ruido (Debounce)
  if (raw != lastRaw) {
    lastRaw = raw;
    lastChangeMs = now;
  }

  if (raw != stableState && (now - lastChangeMs) >= STABLE_MS) {
    int prev = stableState;
    stableState = raw;

    bool prevClosed = isClosed(prev);
    bool nowClosed  = isClosed(stableState);

    // Evento: Ojo se acaba de CERRAR
    if (!prevClosed && nowClosed) {
      ojoCerrado = true;
      closedStartMs = now;
      Serial.println("📉 Ojo CERRADO - Iniciando cronómetro...");
    }

    // Evento: Ojo se acaba de ABRIR
    if (prevClosed && !nowClosed && ojoCerrado) {
      unsigned long duracion = now - closedStartMs;
      ojoCerrado = false;
      
      digitalWrite(BUZZER_PIN, LOW); // Asegurar buzzer apagado

      if (duracion >= CLOSED_LONG_MS) {
        Serial.print("⚠️ MICROSUEÑO FINALIZADO (Duración: ");
        Serial.print(duracion);
        Serial.println(" ms)");
      } else {
        Serial.print("👁️ Parpadeo normal (");
        Serial.print(duracion);
        Serial.println(" ms)");
      }
    }
  }

  // 2. Comprobación continua: ¿Sigue cerrado?
  if (ojoCerrado) {
    unsigned long tiempoCerrado = now - closedStartMs;

    // Si supera el umbral de microsueño (2 seg)
    if (tiempoCerrado >= CLOSED_LONG_MS) {
      
      // A. Activar Alarma Local
      digitalWrite(BUZZER_PIN, HIGH);
      
      // B. Enviar Alerta al Backend (una sola vez por evento, controlado por cooldown)
      if (tiempoCerrado >= (CLOSED_LONG_MS + 100) && (now - lastAlertSentMs > ALERT_COOLDOWN_MS)) {
        Serial.println("🚨 ¡ALERTA CRÍTICA ACTIVADA!");
        sendFatigueAlert(10, "microsueno", "Conductor dormido por > 2s");
        // Nota: lastAlertSentMs se actualiza dentro de la función si tiene éxito
        // Pero para asegurar que no spamee si falla, actualizamos aquí también un poco
        lastAlertSentMs = now; 
      }
    }
  } else {
    // Si el ojo está abierto, buzzer apagado
    digitalWrite(BUZZER_PIN, LOW);
    
    // Si perdió WiFi, intentar reconectar periódicamente (opcional)
    if (WiFi.status() != WL_CONNECTED && (now % 10000 == 0)) {
       WiFi.reconnect();
    }
  }

  delay(10); // Pequeño respiro a la CPU
}
