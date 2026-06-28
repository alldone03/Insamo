#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <LiquidCrystal_I2C.h>
#include <TinyGPSPlus.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ===== Konfigurasi WiFi =====
const char* WIFI_SSID     = "NAMA_WIFI_KAMU";
const char* WIFI_PASSWORD = "PASSWORD_WIFI_KAMU";

// ===== Konfigurasi Backend =====
// Ganti dengan IP server kamu (harus satu jaringan WiFi dengan ESP32)
const char* API_URL     = "http://192.168.1.100:3000/api/sensor-readings";
const char* DEVICE_CODE = "SIGMA-001";

// ===== Hardware =====
Adafruit_MPU6050 mpu;
LiquidCrystal_I2C lcd(0x27, 16, 2);

const int BUZZER_PIN = 27;
float baseline_gravity = 0;

// ===== Konfigurasi GPS NEO-M8N =====
const int GPS_RX_PIN = 16;
const int GPS_TX_PIN = 17;
const unsigned long GPS_BAUD = 9600;

HardwareSerial gpsSerial(2);
TinyGPSPlus gps;

double currentLat       = 0.0;
double currentLng       = 0.0;
bool   gpsFixValid      = false;
uint32_t satelliteCount = 0;

double gempaLat        = 0.0;
double gempaLng        = 0.0;
bool   gempaLokasiValid = false;

unsigned long lastGpsSerialPrint   = 0;
const unsigned long GPS_PRINT_INTERVAL = 2000;

// ===== Parameter Deteksi Gempa =====
const float THRESHOLD_GAL          = 3.0;
const unsigned long CROSSCHECK_MS  = 500;
const int MIN_OSCILLATIONS         = 3;
const unsigned long QUICK_RESET_MS = 300;
const unsigned long GEMPA_RESET_MS = 3000;

// ===== Variabel Status =====
enum StatusGetaran { AMAN, CROSSCHECK, GEMPA };
StatusGetaran status = AMAN;

unsigned long waktuGetaranPertama  = 0;
unsigned long waktuGetaranTerakhir = 0;
float max_pga    = 0;
float last_shindo = 0;

unsigned long lastLcdUpdate = 0;

bool wasAboveThreshold = false;
int  crossingCount     = 0;

// ===== Buzzer =====
unsigned long lastBuzzToggle     = 0;
bool          buzzState          = false;
const unsigned long BUZZ_BLINK_MS = 300;

// ===== LCD Gempa Page =====
int  lcdGempaPage       = 0;
unsigned long lastLcdPageToggle  = 0;
const unsigned long LCD_TOGGLE_MS = 2000;

// ===== Pengiriman Data ke Backend =====
unsigned long lastSendTime           = 0;
const unsigned long SEND_INTERVAL_MS = 2000; // kirim tiap 2 detik

// ===== Prototypes =====
void bacaGPS();
void cetakStatusGPS();
void kirimDataSensor(float ax, float ay, float az,
                     float gx, float gy, float gz,
                     float pga, float shindo,
                     const char* eq_status);
const char* getKeterangan(float s);
const char* statusToString(StatusGetaran s);

// =======================================================
void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // GPS
  gpsSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

  // LCD
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("SIGMA v1.0");
  lcd.setCursor(0, 1);
  lcd.print("Inisialisasi...");
  delay(1000);

  // MPU6050
  if (!mpu.begin()) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Sensor Error!");
    while (1) { delay(10); }
  }
  mpu.setAccelerometerRange(MPU6050_RANGE_2_G);
  mpu.setFilterBandwidth(MPU6050_BAND_5_HZ);

  // Kalibrasi baseline gravitasi
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Kalibrasi...");
  lcd.setCursor(0, 1);
  lcd.print("Tunggu 3 detik");

  float sum = 0;
  sensors_event_t a, g, temp;
  for (int i = 0; i < 100; i++) {
    mpu.getEvent(&a, &g, &temp);
    sum += sqrt(pow(a.acceleration.x, 2) +
                pow(a.acceleration.y, 2) +
                pow(a.acceleration.z, 2));
    delay(10);
  }
  baseline_gravity = sum / 100.0;
  Serial.printf("[KALIBRASI] Baseline gravity: %.4f m/s²\n", baseline_gravity);

  // Koneksi WiFi
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("WiFi Connecting");
  lcd.setCursor(0, 1);
  lcd.print(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int wifiTry = 0;
  while (WiFi.status() != WL_CONNECTED && wifiTry < 20) {
    delay(500);
    wifiTry++;
  }

  lcd.clear();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[WiFi] Terhubung. IP: %s\n", WiFi.localIP().toString().c_str());
    lcd.setCursor(0, 0);
    lcd.print("WiFi OK!");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP().toString());
    delay(1500);
  } else {
    Serial.println("[WiFi] Gagal terhubung. Mode offline.");
    lcd.setCursor(0, 0);
    lcd.print("WiFi GAGAL");
    lcd.setCursor(0, 1);
    lcd.print("Mode Offline");
    delay(1500);
  }

  lcd.clear();
  Serial.println("[SIGMA] Sistem siap.");
}

// =======================================================
void loop() {
  unsigned long currentMillis = millis();

  // 0. Update GPS
  bacaGPS();
  if (currentMillis - lastGpsSerialPrint > GPS_PRINT_INTERVAL) {
    cetakStatusGPS();
    lastGpsSerialPrint = currentMillis;
  }

  // 1. Baca sensor MPU6050
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  float resultant  = sqrt(pow(a.acceleration.x, 2) +
                          pow(a.acceleration.y, 2) +
                          pow(a.acceleration.z, 2));
  float dynamic_ms2 = abs(resultant - baseline_gravity);
  float pga_gal     = dynamic_ms2 * 100.0;

  bool isAboveThreshold = (pga_gal > THRESHOLD_GAL);

  // 2. Logika Crosscheck Gempa
  if (isAboveThreshold) {
    waktuGetaranTerakhir = currentMillis;
    if (pga_gal > max_pga) max_pga = pga_gal;

    bool risingEdge = !wasAboveThreshold;

    if (status == AMAN) {
      status               = CROSSCHECK;
      waktuGetaranPertama  = currentMillis;
      crossingCount        = 1;
    }
    else if (status == CROSSCHECK) {
      if (risingEdge) crossingCount++;

      bool durasiCukup  = (currentMillis - waktuGetaranPertama) > CROSSCHECK_MS;
      bool osilasiCukup = (crossingCount >= MIN_OSCILLATIONS);

      if (durasiCukup && osilasiCukup) {
        status = GEMPA;

        // Snapshot lokasi saat gempa terkonfirmasi
        gempaLat        = currentLat;
        gempaLng        = currentLng;
        gempaLokasiValid = gpsFixValid;
        lcdGempaPage    = 0;
        lastLcdPageToggle = currentMillis;

        Serial.print("[GEMPA TERDETEKSI] PGA: ");
        Serial.print(max_pga, 2);
        Serial.print(" Gal | Lokasi: ");
        if (gempaLokasiValid) {
          Serial.print(gempaLat, 6);
          Serial.print(", ");
          Serial.println(gempaLng, 6);
        } else {
          Serial.println("GPS belum fix");
        }
      }
    }

    wasAboveThreshold = true;
  }
  else {
    wasAboveThreshold = false;

    if (status == CROSSCHECK &&
        (currentMillis - waktuGetaranTerakhir > QUICK_RESET_MS)) {
      status        = AMAN;
      max_pga       = 0;
      crossingCount = 0;
    }
    else if (status == GEMPA &&
             (currentMillis - waktuGetaranTerakhir > GEMPA_RESET_MS)) {
      status          = AMAN;
      max_pga         = 0;
      crossingCount   = 0;
      gempaLokasiValid = false;
      digitalWrite(BUZZER_PIN, LOW);
    }
  }

  // 3. Hitung Shindo (hanya saat GEMPA)
  float shindo = 0;
  if (status == GEMPA) {
    shindo = (2.0 * log10(max_pga)) + 0.94;
    if (shindo < 0) shindo = 0;
    last_shindo = shindo;

    if (shindo >= 4.5) {
      digitalWrite(BUZZER_PIN, HIGH);
    }
    else if (shindo >= 3.0) {
      if (currentMillis - lastBuzzToggle > BUZZ_BLINK_MS) {
        buzzState = !buzzState;
        digitalWrite(BUZZER_PIN, buzzState ? HIGH : LOW);
        lastBuzzToggle = currentMillis;
      }
    }
    else {
      digitalWrite(BUZZER_PIN, LOW);
    }
  }

  // 4. Tampilan LCD (update tiap 300ms)
  if (currentMillis - lastLcdUpdate > 300) {
    lcd.clear();

    if (status == AMAN) {
      lcd.setCursor(0, 0);
      lcd.print("Status: AMAN");
      lcd.setCursor(0, 1);
      if (gpsFixValid) {
        lcd.print("SAT:");
        lcd.print(satelliteCount);
        lcd.print(" PGA:");
        lcd.print(pga_gal, 1);
      } else {
        lcd.print("PGA:");
        lcd.print(pga_gal, 1);
        lcd.print(" NoGPS");
      }
    }
    else if (status == CROSSCHECK) {
      lcd.setCursor(0, 0);
      lcd.print("Cek Getaran...");
      lcd.setCursor(0, 1);
      lcd.print("Osc:");
      lcd.print(crossingCount);
      lcd.print(" PGA:");
      lcd.print(pga_gal, 0);
    }
    else if (status == GEMPA) {
      lcd.setCursor(0, 0);
      lcd.print("AWAS GEMPA!");

      if (currentMillis - lastLcdPageToggle > LCD_TOGGLE_MS) {
        lcdGempaPage    = (lcdGempaPage + 1) % (gempaLokasiValid ? 3 : 1);
        lastLcdPageToggle = currentMillis;
      }

      lcd.setCursor(0, 1);
      if (lcdGempaPage == 0 || !gempaLokasiValid) {
        lcd.print("S:");
        lcd.print(shindo, 1);
        lcd.print(" ");
        lcd.print(getKeterangan(shindo));
      }
      else if (lcdGempaPage == 1) {
        lcd.print("Lat:");
        lcd.print(gempaLat, 5);
      }
      else {
        lcd.print("Lng:");
        lcd.print(gempaLng, 5);
      }
    }

    lastLcdUpdate = currentMillis;
  }

  // 5. Kirim data ke backend (tiap SEND_INTERVAL_MS)
  if (currentMillis - lastSendTime > SEND_INTERVAL_MS) {
    kirimDataSensor(
      a.acceleration.x, a.acceleration.y, a.acceleration.z,
      g.gyro.x, g.gyro.y, g.gyro.z,
      pga_gal,
      (status == GEMPA) ? last_shindo : 0.0,
      statusToString(status)
    );
    lastSendTime = currentMillis;
  }

  delay(10); // ~100Hz loop
}

// =======================================================
// Fungsi kirim data ke backend via HTTP POST
// =======================================================
void kirimDataSensor(float ax, float ay, float az,
                     float gx, float gy, float gz,
                     float pga, float shindo,
                     const char* eq_status) {

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] WiFi tidak terhubung, skip kirim.");
    return;
  }

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000); // timeout 5 detik

  StaticJsonDocument<512> doc;
  doc["device_code"]       = DEVICE_CODE;
  doc["vib_x"]             = ax;
  doc["vib_y"]             = ay;
  doc["vib_z"]             = az;
  doc["gyro_x"]            = gx;
  doc["gyro_y"]            = gy;
  doc["gyro_z"]            = gz;
  doc["pga_gal"]           = pga;
  doc["magnitude"]         = pga;    // fallback untuk chart frontend
  doc["earthquake_status"] = eq_status;
  doc["satellite_count"]   = (int)satelliteCount;

  if (shindo > 0) {
    doc["shindo"]       = shindo;
    doc["device_tilt"]  = shindo; // fallback untuk chart frontend
  }

  // Lokasi GPS realtime (posisi alat saat ini)
  if (gpsFixValid) {
    doc["gempa_lat"] = currentLat;
    doc["gempa_lng"] = currentLng;
  }

  // Override koordinat gempa dengan snapshot saat pertama terdeteksi
  if (gempaLokasiValid) {
    doc["gempa_lat"] = gempaLat;
    doc["gempa_lng"] = gempaLng;
  }

  String body;
  serializeJson(doc, body);

  int httpCode = http.POST(body);

  if (httpCode == 200 || httpCode == 201) {
    Serial.printf("[HTTP] OK (%d) | PGA: %.2f Gal | Status: %s\n",
                  httpCode, pga, eq_status);
  } else {
    Serial.printf("[HTTP] Gagal: %d | %s\n", httpCode, http.errorToString(httpCode).c_str());
  }

  http.end();
}

// =======================================================
// Membaca data NMEA dari GPS (non-blocking)
// =======================================================
void bacaGPS() {
  while (gpsSerial.available() > 0) {
    if (gps.encode(gpsSerial.read())) {
      if (gps.location.isValid() && gps.location.isUpdated()) {
        currentLat  = gps.location.lat();
        currentLng  = gps.location.lng();
        gpsFixValid = true;
      }
      if (gps.satellites.isValid()) {
        satelliteCount = gps.satellites.value();
      }
    }
  }
}

void cetakStatusGPS() {
  Serial.print("[GPS] Fix: ");
  Serial.print(gpsFixValid ? "OK" : "Mencari...");
  if (gpsFixValid) {
    Serial.printf(" | Lat: %.6f | Lng: %.6f | Satelit: %d",
                  currentLat, currentLng, satelliteCount);
  }
  Serial.println();
}

// =======================================================
// Helper
// =======================================================
const char* getKeterangan(float s) {
  if (s < 3.0) return "Lemah";
  else if (s < 4.5) return "Sedang";
  else if (s < 5.5) return "Kuat";
  else return "Keras!";
}

const char* statusToString(StatusGetaran s) {
  switch (s) {
    case GEMPA:     return "GEMPA";
    case CROSSCHECK: return "CROSSCHECK";
    default:         return "AMAN";
  }
}
