#!/usr/bin/env python3
"""
INSAMO Device Sensor Simulator (Random Walk)
Simulates realistic time-series sensor data
"""

import requests
import random
import time
from datetime import datetime

# ================= CONFIG =================
API_BASE_URL = "http://localhost:8000/api"
DEVICE_CODES = ["SIGMA-001", "FLOWS-001", "LANDSLIDE-001"]
INTERVAL_SECONDS = 1
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
def generate_sigma(device_code):
    s = sensor_state[device_code]

    s["tilt_x"] = random_walk(s["tilt_x"], 0.15, -10, 10)
    s["tilt_y"] = random_walk(s["tilt_y"], 0.15, -10, 10)
    s["magnitude"] = random_walk(s["magnitude"], 0.25, 0, 15)
    s["temperature"] = random_walk(s["temperature"], 0.1, 20, 40)

    return s


def generate_flows(device_code):
    s = sensor_state[device_code]

    s["water_level"] = random_walk(s["water_level"], 1.2, 0, 200)
    s["wind_speed"] = random_walk(s["wind_speed"], 0.4, 0, 60)
    s["temperature"] = random_walk(s["temperature"], 0.1, 15, 45)
    s["rainfall_intensity"] = random_walk(s["rainfall_intensity"], 0.3, 0, 30)
    s["humidity"] = random_walk(s["humidity"], 1.0, 30, 100)

    return s


def generate_landslide(device_code):
    s = sensor_state[device_code]

    s["soil_moisture"] = random_walk(s["soil_moisture"], 1.0, 10, 90)
    s["slope_angle"] = random_walk(s["slope_angle"], 0.25, 0, 45)

    score = (
        s["soil_moisture"] * 0.6 +
        s["slope_angle"] * 0.9
    )

    s["landslide_score"] = int(max(0, min(score, 100)))
    s["current_status"] = "DANGER" if s["landslide_score"] >= 60 else "STABLE"

    return s
# ==========================================


# =============== API =======================
def send_data(device_code, data):
    payload = {
        "device_code": device_code,
        "recorded_at": datetime.now().isoformat(),
        **data
    }

    try:
        r = requests.post(
            f"{API_BASE_URL}/sensor-readings",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=5
        )

        if r.status_code in (200, 201):
            print(f"✅ {device_code} sent")
        else:
            print(f"❌ {device_code} failed [{r.status_code}]")

    except Exception as e:
        print(f"⚠️ {device_code} error: {e}")
# ==========================================


# =============== CORE ======================
def get_device_type(code):
    if code.startswith("SIGMA"):
        return "SIGMA"
    if code.startswith("FLOWS"):
        return "FLOWS"
    if code.startswith("LANDSLIDE"):
        return "LANDSLIDE"
    return None


def simulate_device(code):
    dtype = get_device_type(code)

    if dtype == "SIGMA":
        data = generate_sigma(code)
    elif dtype == "FLOWS":
        data = generate_flows(code)
    elif dtype == "LANDSLIDE":
        data = generate_landslide(code)
    else:
        return

    send_data(code, data)


def main():
    print("🚀 INSAMO Random Walk Simulator Started\n")

    try:
        i = 0
        while True:
            i += 1
            print(f"\n--- Iteration {i} --- {datetime.now().strftime('%H:%M:%S')}")

            for code in DEVICE_CODES:
                simulate_device(code)
                time.sleep(0.3)

            time.sleep(INTERVAL_SECONDS)

    except KeyboardInterrupt:
        print("\n⛔ Simulator stopped")
# ==========================================


if __name__ == "__main__":
    main()