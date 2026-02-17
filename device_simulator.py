#!/usr/bin/env python3
"""
INSAMO Device Sensor Simulator (Parallel per Device)
Each device runs independently every 0.5s
"""

import requests
import random
import time
import threading
from datetime import datetime

# ================= CONFIG =================
API_BASE_URL = "https://apiapp.insamo.id/api"
DEVICE_CODES = ["SIGMA-001", "FLOWS-001", "FLOWS-002", "FLOWS-003", "FLOWS-004", "FLOWS-005", "LANDSLIDE-001"]
INTERVAL_SECONDS = 0.5
# ==========================================


# ================= STATE ===================
sensor_state = {
    "SIGMA-001": {
        "tilt_x": 0.0,
        "tilt_y": 0.0,
        "magnitude": 1.0,
        "temperature": 28.0,
    },
    "FLOWS-001": {
        "water_level": 25.0,
        "wind_speed": 2.0,
        "temperature": 27.0,
        "rainfall_intensity": 0.0,
        "humidity": 65.0,
    },
    "FLOWS-002": {
        "water_level": 25.0,
        "wind_speed": 2.0,
        "temperature": 27.0,
        "rainfall_intensity": 0.0,
        "humidity": 65.0,
    },
    "FLOWS-003": {
        "water_level": 25.0,
        "wind_speed": 2.0,
        "temperature": 27.0,
        "rainfall_intensity": 0.0,
        "humidity": 65.0,
    },
    "FLOWS-004": {
        "water_level": 25.0,
        "wind_speed": 2.0,
        "temperature": 27.0,
        "rainfall_intensity": 0.0,
        "humidity": 65.0,
    },
    "FLOWS-005": {
        "water_level": 25.0,
        "wind_speed": 2.0,
        "temperature": 27.0,
        "rainfall_intensity": 0.0,
        "humidity": 65.0,
    },
    "LANDSLIDE-001": {
        "soil_moisture": 35.0,
        "slope_angle": 18.0,
        "landslide_score": 20,
        "current_status": "STABLE",
    }
}
# ==========================================


# =============== UTIL ======================
def random_walk(value, step, min_val, max_val):
    value += random.uniform(-step, step)
    return round(max(min_val, min(value, max_val)), 2)
# ==========================================


# ============== GENERATORS =================
def generate_sigma(code):
    s = sensor_state[code]
    s["tilt_x"] = random_walk(s["tilt_x"], 0.15, -10, 10)
    s["tilt_y"] = random_walk(s["tilt_y"], 0.15, -10, 10)
    s["magnitude"] = random_walk(s["magnitude"], 0.25, 0, 15)
    s["temperature"] = random_walk(s["temperature"], 0.1, 20, 40)
    return s


def generate_flows(code):
    s = sensor_state[code]
    s["water_level"] = random_walk(s["water_level"], 1.2, 0, 200)
    s["wind_speed"] = random_walk(s["wind_speed"], 0.4, 0, 60)
    s["temperature"] = random_walk(s["temperature"], 0.1, 15, 45)
    s["rainfall_intensity"] = random_walk(s["rainfall_intensity"], 0.3, 0, 30)
    s["humidity"] = random_walk(s["humidity"], 1.0, 30, 100)
    return s


def generate_landslide(code):
    s = sensor_state[code]
    s["soil_moisture"] = random_walk(s["soil_moisture"], 1.0, 10, 90)
    s["slope_angle"] = random_walk(s["slope_angle"], 0.25, 0, 45)

    score = s["soil_moisture"] * 0.6 + s["slope_angle"] * 0.9
    s["landslide_score"] = int(max(0, min(score, 100)))
    s["current_status"] = "DANGER" if s["landslide_score"] >= 60 else "STABLE"
    return s
# ==========================================


# =============== API =======================
def send_data(code, data):
    payload = {
        "device_code": code,
        "recorded_at": datetime.now().isoformat(),
        **data
    }

    try:
        r = requests.post(
            f"{API_BASE_URL}/sensor-readings",
            json=payload,
            timeout=5
        )
        print(f"✅ {code} [{r.status_code}] {datetime.now().strftime('%H:%M:%S.%f')[:-3]}")
    except Exception as e:
        print(f"⚠️ {code} error: {e}")
# ==========================================


# =============== CORE ======================
def device_loop(code):
    print(f"🧠 Device {code} started")

    while True:
        if code.startswith("SIGMA"):
            data = generate_sigma(code)
        elif code.startswith("FLOWS"):
            data = generate_flows(code)
        elif code.startswith("LANDSLIDE"):
            data = generate_landslide(code)
        else:
            return

        send_data(code, data)
        time.sleep(INTERVAL_SECONDS)


def main():
    print("🚀 INSAMO Parallel Simulator Started\n")

    threads = []

    for code in DEVICE_CODES:
        t = threading.Thread(target=device_loop, args=(code,), daemon=True)
        t.start()
        threads.append(t)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n⛔ Simulator stopped")
# ==========================================


if __name__ == "__main__":
    main()