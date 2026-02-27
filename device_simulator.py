import requests
import random
import time
from datetime import datetime
import json

# Configuration
API_URL = "http://localhost:3000/api/sensor-readings"
WEATHER_API_URL = "http://localhost:3000/api/weather"
DEVICES = [
    {"code": "SIGMA-001", "type": "SIGMA"},
    {"code": "FLOWS-001", "type": "FLOWS"},
    {"code": "FLOWS-002", "type": "FLOWS"},
    {"code": "LANDSLIDE-001", "type": "LANDSLIDE"},
    {"code": "WILDFIRE-001", "type": "WILDFIRE"}
]

# Initial States for Random Walk
initial_state = {
    "temperature": 25.0,
    "humidity": 60.0,
    "wind_speed": 5.0,
    "water_level": 120.0,
    "soil_moisture": 30.0,
    "vib_x": 0.01,
    "vib_y": 0.01,
    "vib_z": 9.81,
    "gyro_x": 0.0,
    "gyro_y": 0.0,
    "gyro_z": 0.0,
    "rainfall_intensity": 0.0,
    "device_tilt": 0.0,
    "magnitude": 0.1,
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
    print(f"Starting Device Simulator... Sending to {API_URL}")
    while True:
        # Simulate Devices
        for device in DEVICES:
            code = device["code"]
            dtype = device["type"]
            state = device_states[code]

            # Update common fields
            state["temperature"] = random_walk(state["temperature"], 10, 45, 0.5)
            state["humidity"] = random_walk(state["humidity"], 20, 95, 1.0)
            
            payload = {
                "device_code": code,
                "recorded_at": datetime.now().isoformat(),
                "temperature": state["temperature"],
                "humidity": state["humidity"]
            }

            # Type specific updates
            if dtype == "FLOWS":
                state["water_level"] = random_walk(state["water_level"], 0, 500, 2.0)
                state["rainfall_intensity"] = random_walk(state["rainfall_intensity"], 0, 100, 0.5)
                payload.update({
                    "water_level": state["water_level"],
                    "rainfall_intensity": state["rainfall_intensity"],
                    "wind_speed": random_walk(state.get("wind_speed", 5), 0, 50, 0.5)
                })
            
            elif dtype == "LANDSLIDE":
                state["soil_moisture"] = random_walk(state["soil_moisture"], 0, 100, 1.0)
                state["device_tilt"] = random_walk(state["device_tilt"], -10, 10, 0.2)
                payload.update({
                    "soil_moisture": state["soil_moisture"],
                    "device_tilt": state["device_tilt"],
                    "vib_x": random_walk(state["vib_x"], -1, 1, 0.05),
                    "vib_y": random_walk(state["vib_y"], -1, 1, 0.05),
                    "vib_z": random_walk(state["vib_z"], 9, 10, 0.05),
                })

            elif dtype == "SIGMA":
                state["magnitude"] = random_walk(state["magnitude"], 0, 9, 0.1)
                payload.update({
                    "magnitude": state["magnitude"],
                    "vib_x": random_walk(state["vib_x"], -5, 5, 0.5),
                    "vib_y": random_walk(state["vib_y"], -5, 5, 0.5),
                    "vib_z": random_walk(state["vib_z"], 5, 15, 0.5),
                })

            elif dtype == "WILDFIRE":
                pass

            try:
                response = requests.post(API_URL, json=payload, timeout=5)
                if response.status_code == 201 or response.status_code == 200:
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] OK: {code} ({dtype})")
                else:
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] FAILED: {code} - {response.status_code} {response.text}")
            except Exception as e:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] ERROR: {code} - {str(e)}")

        # Simulate Global Weather
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
            if res.status_code == 201:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] OK: WEATHER UPDATED")
        except Exception as e:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] ERROR: WEATHER - {str(e)}")

        time.sleep(5) # Delay 5 seconds between batches

if __name__ == "__main__":
    simulate()