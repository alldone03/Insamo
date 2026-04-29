import requests
import random
import time
from datetime import datetime
import json
import math

# Configuration
API_URL = "http://localhost:3000/api/sensor-readings"
WEATHER_API_URL = "http://localhost:3000/api/weather"
TARGET_READINGS = 0
GENERATE_DUMMY = False 

# Hanya FLOWS devices (untuk LSTM prediction)
DEVICES = [
    # Original Devices
    {"code": "FLOWS-001", "type": "FLOWS", "name": "Ciliwung River Sensor"},
    {"code": "FLOWS-002", "type": "FLOWS", "name": "Bandung Basin Monitor"},
]

# Initial States for Random Walk
initial_state = {
    "temperature": 28.0,
    "humidity": 70.0,
    "wind_speed": 5.0,
    "water_level": 120.0,
    "rainfall_intensity": 0.0,
}

weather_state = {
    "temperature": 27.5,
    "humidity": 76.0,
    "pressure": 1008.0,
    "wind_speed": 1.5
}

device_states = {d["code"]: initial_state.copy() for d in DEVICES}
device_counts = {d["code"]: 0 for d in DEVICES}

def random_walk(current, min_val, max_val, step=0.1):
    new_val = current + random.uniform(-step, step)
    return max(min(new_val, max_val), min_val)

def simulate():
    print(f"{'='*55}")
    print(f"  INSAMO FLOWS Simulator")
    print(f"  Target : {TARGET_READINGS} readings per device")
    print(f"  Devices: {len(DEVICES)}")
    print(f"  Estimasi: ~{TARGET_READINGS * 5 // 60} menit")
    print(f"{'='*55}\n")
    
    batch = 0
    while True:
        batch += 1

        # Cek apakah semua device sudah cukup
        if all(c >= TARGET_READINGS for c in device_counts.values()):
            print(f"\n{'='*55}")
            print(f"  SELESAI! Semua device sudah {TARGET_READINGS} readings.")
            print(f"{'='*55}")
            for code, count in device_counts.items():
                print(f"  {code}: {count} readings")
            break

        # 1. Simulate FLOWS Devices
        for device in DEVICES:
            code = device["code"]
            name = device.get("name", code)
            state = device_states[code]

            if device_counts[code] >= TARGET_READINGS:
                continue

            # Base updates
            state["temperature"] = random_walk(state["temperature"], 15, 45, 0.4)
            state["humidity"] = random_walk(state["humidity"], 30, 95, 0.8)
            state["water_level"] = random_walk(state["water_level"], 0, 500, 2.0)
            state["rainfall_intensity"] = random_walk(state.get("rainfall_intensity", 0), 0, 100, 0.5)
            state["wind_speed"] = random_walk(state.get("wind_speed", 5), 0, 50, 0.5)
            
            payload = {
                "device_code": code,
                "recorded_at": datetime.now().isoformat(),
                "temperature": state["temperature"],
                "humidity": state["humidity"],
                "water_level": state["water_level"],
                "rainfall_intensity": state["rainfall_intensity"],
                "wind_speed": state["wind_speed"],
            }

            try:
                response = requests.post(API_URL, json=payload, timeout=5)
                if response.status_code in [200, 201]:
                    device_counts[code] += 1
                    print(f"  [{datetime.now().strftime('%H:%M:%S')}] OK: {code} ({name})")
                else:
                    print(f"  [{datetime.now().strftime('%H:%M:%S')}] FAILED: {code} - {response.status_code} {response.text}")
            except Exception as e:
                print(f"  [{datetime.now().strftime('%H:%M:%S')}] ERROR: {code} - {str(e)}")

        # 2. Simulate Global Weather
        weather_state["temperature"] = random_walk(weather_state["temperature"], 20, 40, 0.2)
        weather_state["humidity"] = random_walk(weather_state["humidity"], 40, 99, 0.5)
        weather_state["pressure"] = random_walk(weather_state["pressure"], 1000, 1020, 0.1)
        weather_state["wind_speed"] = random_walk(weather_state["wind_speed"], 0, 20, 0.1)

        weather_payload = {
            **weather_state,
            "recorded_at": datetime.now().isoformat()
        }

        try:
            res = requests.post(WEATHER_API_URL, json=weather_payload, timeout=5)
            if res.status_code in [200, 201]:
                print(f"  [{datetime.now().strftime('%H:%M:%S')}] OK: WEATHER UPDATED")
        except Exception as e:
            print(f"  [{datetime.now().strftime('%H:%M:%S')}] ERROR: WEATHER - {str(e)}")

        # 3. Ringkasan batch
        total_done = sum(device_counts.values())
        total_target = len(DEVICES) * TARGET_READINGS
        pct = total_done / total_target * 100

        print(f"\n  Batch {batch} — Progress: {total_done}/{total_target} ({pct:.1f}%)")
        for code, count in device_counts.items():
            bar_len = 20
            filled = int(count / TARGET_READINGS * bar_len)
            bar = '█' * filled + '░' * (bar_len - filled)
            print(f"    {code}: [{bar}] {count}/{TARGET_READINGS}")
        print(f"  Sleep 5s...\n")

        time.sleep(5) 

if __name__ == "__main__":
    simulate()