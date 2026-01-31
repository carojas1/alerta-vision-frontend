// =============================================
// 🚗 ALERTA VISION - ESP32-C3 SUPERMINI
// VERSION: WiFi + Parpadeos NO consecutivos
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
// 🌐 SERVIDOR BACKEND (endpoint /alerts/esp32 público)
// ==========================================
const char* BACKEND_URL = "https://alerta-vision-backend.onrender.com/alerts/esp32";
const int USUARIO_ID = 1;

// ==========================================
// ⚙️ PINES
// ==========================================
#define PIN_SENSOR    5    // GPIO5 = Sensor IR
#define PIN_BUZZER    3    // GPIO3 = Buzzer

// ==========================================
// ⏱️ TIEMPOS
// ==========================================
#define TIEMPO_FILTRO         100    // Anti-rebote (ms)
#define TIEMPO_PARPADEO_LARGO 2000   // 2 segundos = parpadeo largo
#define VENTANA_TIEMPO        30000  // 30 segundos para acumular 2 parpadeos

// ==========================================
// 🧠 VARIABLES
// ==========================================
int lecturaAnterior = HIGH;
int estadoEstable = HIGH;
unsigned long tiempoUltimoCambio = 0;

bool ojoCerrado = false;
unsigned long tiempoInicioCierre = 0;

// Contador de parpadeos (NO tienen que ser seguidos)
int contadorParpadosLargos = 0;
unsigned long tiempoPrimerParpadeo = 0;

bool alarmaActiva = false;
unsigned long tiempoInicioAlarma = 0;

// ==========================================
//  CONECTAR WIFI
// ==========================================
void conectarWiFi() {
  Serial.print("Conectando WiFi");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 20) {
    delay(500);
    Serial.print(".");
    intentos++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(" OK!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(" FALLO");
  }
}

// ==========================================
// 🚀 ENVIAR ALERTA AL SERVIDOR
// ==========================================
void enviarAlerta() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Sin WiFi, no se envia alerta");
    return;
  }

  WiFiClientSecure cliente;
  cliente.setInsecure();
  
  HTTPClient http;
  
  Serial.println("Enviando alerta...");
  
  if (http.begin(cliente, BACKEND_URL)) {
    http.addHeader("Content-Type", "application/json");

    String json = "{";
    json += "\"nivelFatiga\":10,";
    json += "\"tipo_alerta\":\"microsueno\",";
    json += "\"mensaje\":\"Microsueno detectado - 2 parpadeos largos\",";
    json += "\"usuarioId\":" + String(USUARIO_ID);
    json += "}";

    int codigo = http.POST(json);
    Serial.print("Respuesta: ");
    Serial.println(codigo);
    http.end();
  }
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
  Serial.println("================================");
  Serial.println("ALERTA VISION - ESP32-C3");
  Serial.println("================================");

  pinMode(PIN_SENSOR, INPUT_PULLUP);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);

  lecturaAnterior = digitalRead(PIN_SENSOR);
  estadoEstable = lecturaAnterior;
  tiempoUltimoCambio = millis();

  // Conectar WiFi
  conectarWiFi();

  // Bips de inicio
  digitalWrite(PIN_BUZZER, HIGH);
  delay(100);
  digitalWrite(PIN_BUZZER, LOW);
  delay(100);
  digitalWrite(PIN_BUZZER, HIGH);
  delay(100);
  digitalWrite(PIN_BUZZER, LOW);

  Serial.println();
  Serial.println("LISTO! Monitoreando...");
  Serial.println("2 parpadeos largos (>2s) en 30s = ALARMA");
  Serial.println();
}

// ==========================================
// 🔄 LOOP
// ==========================================
void loop() {
  unsigned long ahora = millis();
  int lectura = digitalRead(PIN_SENSOR);

  // Reconectar WiFi si se desconectó
  if (WiFi.status() != WL_CONNECTED) {
    static unsigned long ultimoIntento = 0;
    if (ahora - ultimoIntento > 30000) {
      conectarWiFi();
      ultimoIntento = ahora;
    }
  }

  // Filtro anti-rebote
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

    // Ojo se CERRÓ
    if (!cerradoAntes && cerradoAhora) {
      ojoCerrado = true;
      tiempoInicioCierre = ahora;
      Serial.println(">>> OJO CERRADO");
    }

    // Ojo se ABRIÓ
    if (cerradoAntes && !cerradoAhora && ojoCerrado) {
      unsigned long duracion = ahora - tiempoInicioCierre;
      ojoCerrado = false;

      Serial.print(">>> OJO ABIERTO - ");
      Serial.print(duracion);
      Serial.println(" ms");

      // ¿Fue un parpadeo LARGO?
      if (duracion >= TIEMPO_PARPADEO_LARGO) {
        Serial.println("!!! PARPADEO LARGO !!!");

        // Si pasó mucho tiempo desde el primer parpadeo, reiniciar contador
        if (contadorParpadosLargos > 0 && (ahora - tiempoPrimerParpadeo > VENTANA_TIEMPO)) {
          Serial.println("Ventana expirada, reiniciando contador");
          contadorParpadosLargos = 0;
        }

        // Guardar tiempo del primer parpadeo
        if (contadorParpadosLargos == 0) {
          tiempoPrimerParpadeo = ahora;
        }

        contadorParpadosLargos++;

        Serial.print("Contador: ");
        Serial.print(contadorParpadosLargos);
        Serial.println("/2 (en ventana de 30s)");

        // ¿Ya van 2 parpadeos largos?
        if (contadorParpadosLargos >= 2 && !alarmaActiva) {
          Serial.println();
          Serial.println("!!! ALARMA ACTIVADA !!!");
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
    // Buzzer intermitente
    if ((ahora / 200) % 2 == 0) {
      digitalWrite(PIN_BUZZER, HIGH);
    } else {
      digitalWrite(PIN_BUZZER, LOW);
    }

    // Auto-apagar después de 30 segundos
    if (ahora - tiempoInicioAlarma > 30000) {
      Serial.println("Alarma auto-apagada");
      alarmaActiva = false;
      digitalWrite(PIN_BUZZER, LOW);
    }
  } else {
    digitalWrite(PIN_BUZZER, LOW);
  }

  delay(10);
}
