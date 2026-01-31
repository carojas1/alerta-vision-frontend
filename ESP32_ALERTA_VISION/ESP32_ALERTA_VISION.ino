// =============================================
// 🚗 ALERTA VISION - ESP32-C3 SUPERMINI
// VERSION COMPLETA: WiFi + Batería + Parpadeos
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
const char* BACKEND_URL = "https://alerta-vision-backend.onrender.com/alerts";
const char* STATUS_URL  = "https://alerta-vision-backend.onrender.com/lentes/status";
const int USUARIO_ID = 1;

// ==========================================
// ⚙️ PINES
// ==========================================
#define PIN_SENSOR    5    // GPIO5 = Sensor IR
#define PIN_BUZZER    3    // GPIO3 = Buzzer
#define PIN_BATERIA   0    // GPIO0 = ADC para batería (A0)

// ==========================================
// ⏱️ TIEMPOS
// ==========================================
#define TIEMPO_FILTRO         100    // Anti-rebote (ms)
#define TIEMPO_PARPADEO_LARGO 2000   // 2 segundos = parpadeo largo
#define VENTANA_TIEMPO        30000  // 30 segundos para acumular 2 parpadeos
#define ENVIO_STATUS_INTERVAL 10000  // Enviar status cada 10 seg

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

// Batería
float nivelBateria = 100.0;
unsigned long ultimoEnvioStatus = 0;

// ==========================================
// 🔋 LEER NIVEL DE BATERÍA
// ==========================================
float leerBateria() {
  // Leer ADC (0-4095 en ESP32)
  int lecturaADC = analogRead(PIN_BATERIA);
  
  // Convertir a voltaje (3.3V de referencia)
  // Si usas divisor de voltaje 100k/100k: voltaje real = lectura * 2
  float voltaje = (lecturaADC / 4095.0) * 3.3 * 2;
  
  // Convertir voltaje a porcentaje
  // Batería LiPo: 4.2V = 100%, 3.0V = 0%
  float porcentaje = ((voltaje - 3.0) / (4.2 - 3.0)) * 100.0;
  
  // Limitar entre 0 y 100
  if (porcentaje > 100) porcentaje = 100;
  if (porcentaje < 0) porcentaje = 0;
  
  return porcentaje;
}

// ==========================================
// 📡 CONECTAR WIFI
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
    Serial.println("Sin WiFi");
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
    json += "\"mensaje\":\"Microsueño detectado - 2 parpadeos largos\",";
    json += "\"usuarioId\":" + String(USUARIO_ID);
    json += "}";

    int codigo = http.POST(json);
    Serial.print("Respuesta: ");
    Serial.println(codigo);
    http.end();
  }
}

// ==========================================
// 📊 ENVIAR STATUS (BATERÍA)
// ==========================================
void enviarStatus() {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure cliente;
  cliente.setInsecure();
  
  HTTPClient http;
  
  if (http.begin(cliente, STATUS_URL)) {
    http.addHeader("Content-Type", "application/json");

    String json = "{";
    json += "\"usuarioId\":" + String(USUARIO_ID) + ",";
    json += "\"bateria\":" + String(nivelBateria, 1) + ",";
    json += "\"conectado\":true,";
    json += "\"alarmaActiva\":" + String(alarmaActiva ? "true" : "false");
    json += "}";

    int codigo = http.POST(json);
    if (codigo == 200 || codigo == 201) {
      Serial.print("Status enviado. Bateria: ");
      Serial.print(nivelBateria);
      Serial.println("%");
    }
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
  Serial.println("Con bateria + WiFi");
  Serial.println("================================");

  pinMode(PIN_SENSOR, INPUT_PULLUP);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_BATERIA, INPUT);
  digitalWrite(PIN_BUZZER, LOW);

  lecturaAnterior = digitalRead(PIN_SENSOR);
  estadoEstable = lecturaAnterior;
  tiempoUltimoCambio = millis();

  // Leer batería inicial
  nivelBateria = leerBateria();
  Serial.print("Bateria: ");
  Serial.print(nivelBateria);
  Serial.println("%");

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

  // Reconectar WiFi
  if (WiFi.status() != WL_CONNECTED) {
    static unsigned long ultimoIntento = 0;
    if (ahora - ultimoIntento > 30000) {
      conectarWiFi();
      ultimoIntento = ahora;
    }
  }

  // Enviar status periódicamente
  if (ahora - ultimoEnvioStatus > ENVIO_STATUS_INTERVAL) {
    nivelBateria = leerBateria();
    enviarStatus();
    ultimoEnvioStatus = ahora;
  }

  // Filtro anti-rebote
  if (lectura != lecturaAnterior) {
    lecturaAnterior = lectura;
    tiempoUltimoCambio = ahora;
  }

  // Procesar cambio
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

        // Si pasó mucho tiempo desde el primer parpadeo, reiniciar
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

        // ¿Ya van 2?
        if (contadorParpadosLargos >= 2 && !alarmaActiva) {
          Serial.println();
          Serial.println("!!! ALARMA ACTIVADA !!!");
          Serial.println();
          alarmaActiva = true;
          tiempoInicioAlarma = ahora;
          contadorParpadosLargos = 0;
          
          enviarAlerta();
          enviarStatus();
        }
      }
    }
  }

  // Alarma
  if (alarmaActiva) {
    if ((ahora / 200) % 2 == 0) {
      digitalWrite(PIN_BUZZER, HIGH);
    } else {
      digitalWrite(PIN_BUZZER, LOW);
    }

    // Auto-apagar 30 seg
    if (ahora - tiempoInicioAlarma > 30000) {
      Serial.println("Alarma auto-apagada");
      alarmaActiva = false;
      digitalWrite(PIN_BUZZER, LOW);
      enviarStatus();
    }
  } else {
    digitalWrite(PIN_BUZZER, LOW);
  }

  delay(10);
}
