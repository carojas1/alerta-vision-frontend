// =============================================
// 🚗 ALERTA VISION - ESP32-C3 SUPERMINI
// VERSION: LÓGICA CORRECTA DE ALERTAS
// Usuario ID: 5 (andres2007benavides@gmail.com)
// =============================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// ==========================================
// 📶 CONFIGURACIÓN WIFI
// ==========================================
const char* WIFI_SSID     = "ANDRES 4607";
const char* WIFI_PASSWORD = "12345678";

// ==========================================
// 🌐 SERVIDOR BACKEND
// ==========================================
const char* BACKEND_URL = "https://alerta-vision-backend.onrender.com/alerts/esp32";
const char* LENTES_UPDATE_URL = "https://alerta-vision-backend.onrender.com/lentes/update";
const char* LENTES_CHECK_URL = "https://alerta-vision-backend.onrender.com/lentes/check-silence";

// ⚠️ ID DEL USUARIO EN LA BASE DE DATOS
const int USUARIO_ID = 5;
const char* USUARIO_EMAIL = "andres2007benavides@gmail.com";

// ==========================================
// ⚙️ PINES
// ==========================================
#define PIN_SENSOR    5    // GPIO5 = Sensor IR
#define PIN_BUZZER    3    // GPIO3 = Buzzer
#define PIN_VIBRADOR  4    // GPIO4 = Motor vibrador
#define PIN_BATERIA   0    // GPIO0 = Lectura de batería (ADC)

// ==========================================
// ⏱️ TIEMPOS
// ==========================================
#define TIEMPO_FATIGA         2000   // 2 segundos = ojo cerrado = FATIGA
#define INTERVALO_BATERIA     10000  // Actualizar batería cada 10 segundos
#define INTERVALO_SILENCIO    2000   // Verificar silencio cada 2 segundos
#define TIEMPO_RESET_CONTADOR 60000  // 60 segundos para resetear contador de fatigas

// ==========================================
// 🔋 CONFIGURACIÓN BATERÍA
// ==========================================
#define VOLTAJE_MAX  4.2
#define VOLTAJE_MIN  3.0
#define ADC_MAX      4095
#define VOLTAJE_REF  3.3
#define DIVISOR_R1   10000
#define DIVISOR_R2   10000

// ==========================================
// 🔄 CONFIGURACIÓN DE REINTENTOS
// ==========================================
#define MAX_REINTENTOS_WIFI    20
#define MAX_REINTENTOS_HTTP    5
#define DELAY_REINTENTO_HTTP   2000
#define INTERVALO_RECONEXION   5000

// ==========================================
// 🧠 VARIABLES
// ==========================================
bool ojoCerrado = false;
unsigned long tiempoInicioCierre = 0;

// 🚨 CONTADOR DE FATIGAS
int contadorFatigas = 0;           // Cuántas fatigas consecutivas
unsigned long tiempoUltimaFatiga = 0;

// 🔔 ESTADO DE ALARMAS
bool alarmaTemporalActiva = false;   // Primera fatiga - se apaga al abrir ojos
bool alarmaPermanenteActiva = false; // Segunda fatiga - solo se apaga desde app

bool wifiConectado = false;
unsigned long ultimoIntentoWifi = 0;

// 🔋 Variables de batería
int nivelBateria = 100;
unsigned long ultimaLecturaBateria = 0;
bool bateriaBaja = false;

// 🔇 Silenciamiento
unsigned long ultimaVerificacionSilencio = 0;

// ==========================================
// 🔋 LEER NIVEL DE BATERIA
// ==========================================
int leerBateria() {
  int valorADC = analogRead(PIN_BATERIA);
  float voltajeADC = (valorADC * VOLTAJE_REF) / ADC_MAX;
  float voltajeBateria = voltajeADC * ((DIVISOR_R1 + DIVISOR_R2) / DIVISOR_R2);
  
  int porcentaje = (int)((voltajeBateria - VOLTAJE_MIN) / (VOLTAJE_MAX - VOLTAJE_MIN) * 100);
  
  if (porcentaje > 100) porcentaje = 100;
  if (porcentaje < 0) porcentaje = 0;
  
  Serial.print("🔋 Batería: ");
  Serial.print(porcentaje);
  Serial.println("%");
  
  return porcentaje;
}

// ==========================================
// 📡 CONECTAR WIFI
// ==========================================
bool conectarWiFi() {
  Serial.println();
  Serial.println("╔════════════════════════════════════╗");
  Serial.println("║     📶 CONECTANDO A WIFI...        ║");
  Serial.println("╚════════════════════════════════════╝");
  
  WiFi.disconnect(true);
  delay(1000);
  WiFi.mode(WIFI_STA);
  delay(100);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < MAX_REINTENTOS_WIFI) {
    delay(500);
    Serial.print(".");
    intentos++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ ¡WIFI CONECTADO!");
    Serial.print("📍 IP: ");
    Serial.println(WiFi.localIP());
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
  
  Serial.println("\n❌ WiFi FALLÓ");
  wifiConectado = false;
  return false;
}

// ==========================================
// 🔄 VERIFICAR WIFI
// ==========================================
void verificarWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    wifiConectado = true;
    return;
  }
  
  wifiConectado = false;
  unsigned long ahora = millis();
  
  if (ahora - ultimoIntentoWifi > INTERVALO_RECONEXION) {
    conectarWiFi();
    ultimoIntentoWifi = ahora;
  }
}

// ==========================================
// 📤 ENVIAR ESTADO AL BACKEND
// ==========================================
void enviarEstado() {
  if (!wifiConectado) return;
  
  WiFiClientSecure cliente;
  cliente.setInsecure();
  cliente.setTimeout(10000);
  
  HTTPClient http;
  http.setTimeout(10000);
  
  if (http.begin(cliente, LENTES_UPDATE_URL)) {
    http.addHeader("Content-Type", "application/json");
    
    String json = "{";
    json += "\"email\":\"" + String(USUARIO_EMAIL) + "\",";
    json += "\"conectados\":true,";
    json += "\"bateria\":" + String(nivelBateria) + ",";
    json += "\"alarmaActiva\":" + String(alarmaPermanenteActiva ? "true" : "false");
    json += "}";
    
    int codigo = http.POST(json);
    http.end();
    
    if (codigo == 200 || codigo == 201) {
      Serial.println("📤 Estado enviado");
    }
  }
}

// ==========================================
// 🔇 VERIFICAR SI DEBE SILENCIAR
// ==========================================
bool verificarSilencio() {
  if (!wifiConectado || !alarmaPermanenteActiva) return false;
  
  WiFiClientSecure cliente;
  cliente.setInsecure();
  cliente.setTimeout(5000);
  
  HTTPClient http;
  http.setTimeout(5000);
  
  if (http.begin(cliente, LENTES_CHECK_URL)) {
    http.addHeader("Content-Type", "application/json");
    
    String json = "{\"email\":\"" + String(USUARIO_EMAIL) + "\"}";
    
    int codigo = http.POST(json);
    
    if (codigo == 200) {
      String respuesta = http.getString();
      http.end();
      
      if (respuesta.indexOf("\"shouldSilence\":true") > -1) {
        Serial.println("🔇 ¡Silencio desde la app!");
        return true;
      }
    } else {
      http.end();
    }
  }
  
  return false;
}

// ==========================================
// 🚀 ENVIAR ALERTA
// ==========================================
bool enviarAlerta(int numeroFatiga) {
  if (!wifiConectado) {
    Serial.println("⚠️ Sin WiFi");
    return false;
  }

  Serial.println();
  Serial.println("🚨🚨🚨 ENVIANDO ALERTA 🚨🚨🚨");

  for (int intento = 1; intento <= MAX_REINTENTOS_HTTP; intento++) {
    WiFiClientSecure cliente;
    cliente.setInsecure();
    cliente.setTimeout(60000);
    
    HTTPClient http;
    http.setTimeout(60000);
    
    if (http.begin(cliente, BACKEND_URL)) {
      http.addHeader("Content-Type", "application/json");

      String mensaje = numeroFatiga == 1 
        ? "Fatiga detectada - Primera advertencia"
        : "¡FATIGA CRÍTICA! - Requiere descanso obligatorio";

      String json = "{";
      json += "\"nivelFatiga\":" + String(numeroFatiga * 5) + ",";
      json += "\"tipo_alerta\":\"" + String(numeroFatiga == 1 ? "advertencia" : "critica") + "\",";
      json += "\"mensaje\":\"" + mensaje + "\",";
      json += "\"usuarioId\":" + String(USUARIO_ID) + ",";
      json += "\"email\":\"" + String(USUARIO_EMAIL) + "\",";
      json += "\"bateria\":" + String(nivelBateria) + ",";
      json += "\"numeroFatiga\":" + String(numeroFatiga);
      json += "}";

      int codigo = http.POST(json);
      http.end();

      if (codigo == 200 || codigo == 201) {
        Serial.println("✅ ¡ALERTA ENVIADA!");
        return true;
      }
    }
    
    delay(DELAY_REINTENTO_HTTP);
  }
  
  return false;
}

// ==========================================
// 🔔 CONTROL DE ALARMA
// ==========================================
void activarBuzzer() {
  digitalWrite(PIN_BUZZER, HIGH);
  digitalWrite(PIN_VIBRADOR, HIGH);
}

void desactivarBuzzer() {
  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(PIN_VIBRADOR, LOW);
}

// ==========================================
// 🚀 SETUP
// ==========================================
void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println();
  Serial.println("╔══════════════════════════════════════════╗");
  Serial.println("║    🚗 ALERTA VISION - LÓGICA CORRECTA    ║");
  Serial.println("║    👤 Usuario ID: 5                      ║");
  Serial.println("╚══════════════════════════════════════════╝");
  Serial.println();
  Serial.println("📋 FUNCIONAMIENTO:");
  Serial.println("   1ª FATIGA: Buzzer suena, se apaga al abrir ojos");
  Serial.println("   2ª FATIGA: Buzzer NO se apaga, solo desde la APP");
  Serial.println();

  pinMode(PIN_SENSOR, INPUT_PULLUP);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_VIBRADOR, OUTPUT);
  pinMode(PIN_BATERIA, INPUT);
  
  desactivarBuzzer();

  nivelBateria = leerBateria();
  
  conectarWiFi();
  enviarEstado();

  Serial.println("✅ SISTEMA LISTO");
  Serial.println();
}

// ==========================================
// 🔄 LOOP PRINCIPAL
// ==========================================
void loop() {
  unsigned long ahora = millis();
  
  // Leer sensor (LOW = ojo cerrado)
  bool ojoEstaAhora = (digitalRead(PIN_SENSOR) == LOW);

  verificarWiFi();

  // Leer batería periódicamente
  if (ahora - ultimaLecturaBateria > INTERVALO_BATERIA) {
    nivelBateria = leerBateria();
    ultimaLecturaBateria = ahora;
    enviarEstado();
    
    // Alerta batería crítica
    if (nivelBateria <= 5 && !bateriaBaja) {
      Serial.println("⚠️ ¡BATERÍA CRÍTICA!");
      bateriaBaja = true;
      for (int i = 0; i < 5; i++) {
        digitalWrite(PIN_BUZZER, HIGH);
        delay(100);
        digitalWrite(PIN_BUZZER, LOW);
        delay(100);
      }
    } else if (nivelBateria > 5) {
      bateriaBaja = false;
    }
  }

  // ===== DETECTAR CIERRE DE OJO =====
  if (ojoEstaAhora && !ojoCerrado) {
    // El ojo se acaba de cerrar
    ojoCerrado = true;
    tiempoInicioCierre = ahora;
    Serial.println("👁️ OJO CERRADO - Contando tiempo...");
  }

  // ===== MIENTRAS OJO ESTÁ CERRADO =====
  if (ojoCerrado && ojoEstaAhora) {
    unsigned long duracionCerrado = ahora - tiempoInicioCierre;
    
    // ¿Pasaron 2 segundos con ojo cerrado? = FATIGA
    if (duracionCerrado >= TIEMPO_FATIGA && !alarmaTemporalActiva && !alarmaPermanenteActiva) {
      
      // Resetear contador si pasó mucho tiempo desde última fatiga
      if (ahora - tiempoUltimaFatiga > TIEMPO_RESET_CONTADOR) {
        contadorFatigas = 0;
      }
      
      contadorFatigas++;
      tiempoUltimaFatiga = ahora;
      
      Serial.println();
      Serial.print("🚨 ¡FATIGA #");
      Serial.print(contadorFatigas);
      Serial.println(" DETECTADA!");
      
      if (contadorFatigas == 1) {
        // ===== PRIMERA FATIGA =====
        Serial.println("⚠️ Primera fatiga - Buzzer se apagará al abrir ojos");
        alarmaTemporalActiva = true;
        activarBuzzer();
        enviarAlerta(1);
        
      } else if (contadorFatigas >= 2) {
        // ===== SEGUNDA FATIGA =====
        Serial.println("🔴 ¡FATIGA CRÍTICA! Solo se apaga desde la APP");
        alarmaTemporalActiva = false;
        alarmaPermanenteActiva = true;
        activarBuzzer();
        enviarAlerta(2);
      }
    }
  }

  // ===== OJO SE ABRE =====
  if (!ojoEstaAhora && ojoCerrado) {
    ojoCerrado = false;
    unsigned long duracion = ahora - tiempoInicioCierre;
    
    Serial.print("👁️ OJO ABIERTO (cerrado ");
    Serial.print(duracion);
    Serial.println("ms)");
    
    // Si era SOLO alarma temporal (primera fatiga), apagarla
    if (alarmaTemporalActiva && !alarmaPermanenteActiva) {
      Serial.println("✅ Alarma temporal desactivada");
      alarmaTemporalActiva = false;
      desactivarBuzzer();
    }
  }

  // ===== ALARMA PERMANENTE - Solo se apaga desde app =====
  if (alarmaPermanenteActiva) {
    // Hacer parpadear buzzer
    if ((ahora / 300) % 2 == 0) {
      activarBuzzer();
    } else {
      desactivarBuzzer();
    }
    
    // Verificar si la app quiere silenciar
    if (ahora - ultimaVerificacionSilencio > INTERVALO_SILENCIO) {
      ultimaVerificacionSilencio = ahora;
      if (verificarSilencio()) {
        Serial.println("🔇 ¡Silenciado desde la app!");
        alarmaPermanenteActiva = false;
        contadorFatigas = 0;  // Resetear contador
        desactivarBuzzer();
      }
    }
  }

  delay(50);
}
