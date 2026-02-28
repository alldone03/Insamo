import requests
import random
import time
from datetime import datetime
import json
import math

# Configuration
# Use your production URL or localhost depending on where you run this
API_URL = "https://apiapp.insamo.id/api/sensor-readings"
WEATHER_API_URL = "https://apiapp.insamo.id/api/weather"

# List of all devices to simulate (Original + 20 East Java)
DEVICES = [
    # Original Devices
    {"code": "SIGMA-001", "type": "SIGMA", "name": "Seismic Node A1"},
    {"code": "FLOWS-001", "type": "FLOWS", "name": "Ciliwung River Sensor"},
    {"code": "FLOWS-002", "type": "FLOWS", "name": "Bandung Basin Monitor"},
    {"code": "LANDSLIDE-001", "type": "LANDSLIDE", "name": "Puncak Pass Monitor"},
    {"code": "WILDFIRE-001", "type": "WILDFIRE", "name": "Kalimantan Forest Node"},
    
    # East Java Devices
    {"code": "EJ-DEV-001", "type": "FLOWS", "name": "Surabaya Monitor"},
    {"code": "EJ-DEV-002", "type": "SIGMA", "name": "Malang Monitor"},
    {"code": "EJ-DEV-003", "type": "LANDSLIDE", "name": "Kediri Monitor"},
    {"code": "EJ-DEV-004", "type": "FLOWS", "name": "Madiun Monitor"},
    {"code": "EJ-DEV-005", "type": "SIGMA", "name": "Jember Monitor"},
    {"code": "EJ-DEV-006", "type": "WILDFIRE", "name": "Banyuwangi Monitor"},
    {"code": "EJ-DEV-007", "type": "LANDSLIDE", "name": "Blitar Monitor"},
    {"code": "EJ-DEV-008", "type": "FLOWS", "name": "Mojokerto Monitor"},
    {"code": "EJ-DEV-009", "type": "SIGMA", "name": "Pasuruan Monitor"},
    {"code": "EJ-DEV-010", "type": "WILDFIRE", "name": "Probolinggo Monitor"},
    {"code": "EJ-DEV-011", "type": "LANDSLIDE", "name": "Batu Monitor"},
    {"code": "EJ-DEV-012", "type": "FLOWS", "name": "Sidoarjo Monitor"},
    {"code": "EJ-DEV-013", "type": "FLOWS", "name": "Gresik Monitor"},
    {"code": "EJ-DEV-014", "type": "FLOWS", "name": "Lamongan Monitor"},
    {"code": "EJ-DEV-015", "type": "SIGMA", "name": "Tuban Monitor"},
    {"code": "EJ-DEV-016", "type": "FLOWS", "name": "Bojonegoro Monitor"},
    {"code": "EJ-DEV-017", "type": "LANDSLIDE", "name": "Ngawi Monitor"},
    {"code": "EJ-DEV-018", "type": "LANDSLIDE", "name": "Magetan Monitor"},
    {"code": "EJ-DEV-019", "type": "LANDSLIDE", "name": "Ponorogo Monitor"},
    {"code": "EJ-DEV-020", "type": "FLOWS", "name": "Tulungagung Monitor"},
]

# Initial States for Random Walk
initial_state = {
    "temperature": 28.0,
    "humidity": 70.0,
    "wind_speed": 5.0,
    "water_level": 120.0,
    "soil_moisture": 35.0,
    "vib_x": 0.01,
    "vib_y": 0.01,
    "vib_z": 9.81,
    "magnitude": 0.1,
    "rainfall_intensity": 0.0,
    "device_tilt": 0.0,
    "gyro_x": 45.0,
    "gyro_y": 45.0,
    "gyro_z": 45.0,
}

weather_state = {
    "temperature": 27.5,
    "humidity": 76.0,
    "pressure": 1008.0,
    "wind_speed": 1.5
}

device_states = {d["code"]: initial_state.copy() for d in DEVICES}

def random_walk(current, min_val, max_val, step=0.1):
    new_val = current + random.uniform(-step, step)
    return max(min(new_val, max_val), min_val)

def simulate():
    print(f"Starting Consolidated Device Simulator... Sending to {API_URL}")
    print(f"Total Devices: {len(DEVICES)}")
    
    while True:
        # 1. Simulate Devices
        for device in DEVICES:
            code = device["code"]
            dtype = device["type"]
            name = device.get("name", code)
            state = device_states[code]

            # Base updates
            state["temperature"] = random_walk(state["temperature"], 15, 45, 0.4)
            state["humidity"] = random_walk(state["humidity"], 30, 95, 0.8)
            
            payload = {
                "device_code": code,
                "recorded_at": datetime.now().isoformat(),
                "temperature": state["temperature"],
                "humidity": state["humidity"]
            }

            # Type specific logic
            if dtype == "FLOWS":
                state["water_level"] = random_walk(state["water_level"], 0, 500, 2.0)
                state["rainfall_intensity"] = random_walk(state.get("rainfall_intensity", 0), 0, 100, 0.5)
                payload.update({
                    "water_level": state["water_level"],
                    "rainfall_intensity": state["rainfall_intensity"],
                    "wind_speed": random_walk(state.get("wind_speed", 5), 0, 50, 0.5)
                })
            
            elif dtype == "LANDSLIDE":
                t = time.time()
                state["soil_moisture"] = 35.0 + 10.0 * math.sin(t * 0.1)
                state["device_tilt"] = 1.5 * math.sin(t * 0.2)
                state["gyro_x"] = 45.0 + 30.0 * math.sin(t * 0.5)
                state["gyro_y"] = 45.0 + 30.0 * math.cos(t * 0.4)
                state["gyro_z"] = 45.0 + 30.0 * math.sin(t * 0.3)
                
                state["vib_x"] = 0.08 * math.sin(t * 5.0)
                state["vib_y"] = 0.08 * math.cos(t * 4.0)
                state["vib_z"] = 9.81 + 0.15 * math.sin(t * 3.0)

                payload.update({
                    "soil_moisture": state["soil_moisture"],
                    "device_tilt": state["device_tilt"],
                    "vib_x": state["vib_x"],
                    "vib_y": state["vib_y"],
                    "vib_z": state["vib_z"],
                    "gyro_x": state["gyro_x"],
                    "gyro_y": state["gyro_y"],
                    "gyro_z": state["gyro_z"],
                })

            elif dtype == "SIGMA":
                # Magnitude spiking logic
                if random.random() > 0.98:
                    state["magnitude"] = random.uniform(2.0, 6.0)
                else:
                    state["magnitude"] = random_walk(state["magnitude"], 0, 1.0, 0.1)
                
                payload.update({
                    "magnitude": state["magnitude"],
                    "vib_x": random.uniform(-4, 4) if state["magnitude"] > 2 else random.uniform(-0.2, 0.2),
                    "vib_y": random.uniform(-4, 4) if state["magnitude"] > 2 else random.uniform(-0.2, 0.2),
                    "vib_z": random.uniform(6, 14) if state["magnitude"] > 2 else random.uniform(9.6, 10.0),
                })

            elif dtype == "WILDFIRE":
                # High heat, low humidity simulation
                state["temperature"] = random_walk(state["temperature"], 30, 55, 1.2)
                state["humidity"] = random_walk(state["humidity"], 10, 40, 1.0)
                payload.update({
                    "temperature": state["temperature"],
                    "humidity": state["humidity"]
                })

            try:
                response = requests.post(API_URL, json=payload, timeout=5)
                if response.status_code in [200, 201]:
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] OK: {code} ({name})")
                else:
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] FAILED: {code} - {response.status_code} {response.text}")
            except Exception as e:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] ERROR: {code} - {str(e)}")

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
                print(f"[{datetime.now().strftime('%H:%M:%S')}] OK: WEATHER UPDATED")
        except Exception as e:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] ERROR: WEATHER - {str(e)}")

        print(f"--- Batch Done at {datetime.now().strftime('%H:%M:%S')}. Sleep 5s ---")
        time.sleep(5) 

if __name__ == "__main__":
    simulate()