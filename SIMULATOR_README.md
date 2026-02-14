# 🤖 Device Simulator - INSAMO

Python script untuk mensimulasikan pengiriman data sensor dari perangkat IoT ke backend INSAMO.

## 📋 Fitur

- ✅ Simulasi 3 tipe device: **SIGMA**, **FLOWS**, **LANDSLIDE**
- ✅ Generate data sensor yang realistis
- ✅ Pengiriman data otomatis setiap 30 detik (configurable)
- ✅ Mendukung multiple devices secara bersamaan
- ✅ Real-time logging dengan emoji indicators

## 🚀 Cara Penggunaan

### 1. Install Dependencies

```bash
pip install -r simulator_requirements.txt
```

### 2. Konfigurasi Device Codes

Edit file `device_simulator.py` pada line 14-15:

```python
DEVICE_CODES = ["SIGMA-001", "FLOWS-001", "LANDSLIDE-001"]  # Ganti dengan device_code yang ada di database
INTERVAL_SECONDS = 30   # Interval pengiriman data (detik)
```

**Catatan**: Gunakan **device_code** (bukan device_id). Contoh: `"SIGMA-001"`, `"FLOWS-001"`, dll.

### 3. Jalankan Simulator

```bash
python device_simulator.py
```

### 4. Stop Simulator

Tekan `Ctrl+C` untuk menghentikan simulator.

## 📊 Data yang Digenerate

### SIGMA Device (Stability Sensors)
- `tilt_x`: -5 sampai 5
- `tilt_y`: -5 sampai 5  
- `magnitude`: 0 sampai 10
- `temperature`: 20°C sampai 35°C

### FLOWS Device (Environmental Sensors)
- `water_level`: 0 sampai 100
- `wind_speed`: 0 sampai 50 km/h
- `temperature`: 15°C sampai 40°C
- `rainfall_intensity`: 0 sampai 20 mm/h
- `humidity`: 30% sampai 90%

### LANDSLIDE Device (Risk Sensors)
- `landslide_score`: 0 sampai 100
- `current_status`: "STABLE" atau "DANGER"
- `soil_moisture`: 10% sampai 80%
- `slope_angle`: 0° sampai 45°

## ⚙️ Persyaratan

- Python 3.7+
- Backend API berjalan di `http://localhost:8000`
- Device sudah terdaftar di database dengan ID yang valid

## 📝 Catatan

- Simulator akan otomatis detect tipe device berdasarkan device_id
- Data dikirim ke endpoint: `POST /api/sensor-readings`
- Status **ONLINE** akan aktif jika data diterima dalam 1 menit terakhir
- Status **OFFLINE** jika data terakhir > 1 menit yang lalu

## 🔧 Troubleshooting

**Connection Error:**
```
⚠️  Device 1: Connection error - ...
```
**Solusi:** Pastikan backend API sudah berjalan di `localhost:8000`

**Device Not Found:**
```
✗ Device 1: Not found or error
```
**Solusi:** Pastikan device_id sudah ada di database

**401 Unauthorized:**
**Solusi:** Endpoint `/api/sensor-readings` mungkin memerlukan authentication. Update script untuk menambahkan token.

## 🎯 Testing Online/Offline Status

1. Jalankan simulator: Device akan tampil **ONLINE** (badge hijau dengan animasi pulse)
2. Stop simulator: Tunggu 1 menit, device akan berubah **OFFLINE** (badge merah)
3. Jalankan kembali: Device kembali **ONLINE**
