#!/usr/bin/env python3
"""
Device Sensor Data Simulator for INSAMO
Simulates sensor readings from SIGMA, FLOWS, and LANDSLIDE devices
"""

import requests
import random
import time
from datetime import datetime
import json

# Configuration
API_BASE_URL = "http://localhost:8000/api"
DEVICE_CODES = ["SIGMA-001", "FLOWS-001", "LANDSLIDE-001"]  # Update with your device codes
INTERVAL_SECONDS = 1  # Send data every 30 seconds

def generate_sigma_data():
    """Generate data for SIGMA device (stability sensors)"""
    return {
        "tilt_x": round(random.uniform(-5, 5), 2),
        "tilt_y": round(random.uniform(-5, 5), 2),
        "magnitude": round(random.uniform(0, 10), 2),
        "temperature": round(random.uniform(20, 35), 1),
    }

def generate_flows_data():
    """Generate data for FLOWS device (environmental sensors)"""
    return {
        "water_level": round(random.uniform(0, 100), 1),
        "wind_speed": round(random.uniform(0, 50), 1),
        "temperature": round(random.uniform(15, 40), 1),
        "rainfall_intensity": round(random.uniform(0, 20), 1),
        "humidity": round(random.uniform(30, 90), 1),
    }

def generate_landslide_data():
    """Generate data for LANDSLIDE device (risk sensors)"""
    score = random.randint(0, 100)
    status = "STABLE" if score < 50 else "DANGER"
    return {
        "landslide_score": score,
        "current_status": status,
        "soil_moisture": round(random.uniform(10, 80), 1),
        "slope_angle": round(random.uniform(0, 45), 1),
    }

def get_device_type_from_code(device_code):
    """Infer device type from device code prefix"""
    if device_code.startswith("SIGMA"):
        return "SIGMA"
    elif device_code.startswith("FLOWS"):
        return "FLOWS"
    elif device_code.startswith("LANDSLIDE"):
        return "LANDSLIDE"
    else:
        return None

def send_sensor_reading(device_code, data):
    """Send sensor reading to API"""
    payload = {
        "device_code": device_code,
        "recorded_at": datetime.now().isoformat(),
        **data
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/sensor-readings",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code in [200, 201]:
            print(f"✅ Device {device_code}: Data sent successfully")
            return True
        else:
            print(f"❌ Device {device_code}: Failed ({response.status_code})")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"⚠️  Device {device_code}: Connection error - {e}")
        return False

def simulate_device(device_code, device_type):
    """Simulate a single device's sensor reading"""
    if device_type == "SIGMA":
        data = generate_sigma_data()
    elif device_type == "FLOWS":
        data = generate_flows_data()
    elif device_type == "LANDSLIDE":
        data = generate_landslide_data()
    else:
        print(f"⚠️  Unknown device type: {device_type}")
        return False
    
    return send_sensor_reading(device_code, data)

def main():
    """Main simulation loop"""
    print("=" * 60)
    print("🚀 INSAMO Device Simulator Started")
    print("=" * 60)
    print(f"📡 API Endpoint: {API_BASE_URL}")
    print(f"⏱️  Interval: {INTERVAL_SECONDS} seconds")
    print(f"🔧 Device Codes: {DEVICE_CODES}")
    print("=" * 60)
    
    # Infer device types from codes
    device_map = {}
    for device_code in DEVICE_CODES:
        device_type = get_device_type_from_code(device_code)
        if device_type:
            device_map[device_code] = device_type
            print(f"✓ {device_code}: Type={device_type}")
        else:
            print(f"✗ {device_code}: Cannot infer type (use SIGMA-, FLOWS-, or LANDSLIDE- prefix)")
    
    if not device_map:
        print("\n❌ No valid device codes. Exiting.")
        return
    
    print("\n🔄 Starting data transmission...\n")
    
    iteration = 0
    try:
        while True:
            iteration += 1
            print(f"\n--- Iteration #{iteration} [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ---")
            
            for device_code, device_type in device_map.items():
                simulate_device(device_code, device_type)
                time.sleep(0.5)  # Small delay between devices
            
            print(f"\n⏳ Waiting {INTERVAL_SECONDS} seconds...")
            time.sleep(INTERVAL_SECONDS)
            
    except KeyboardInterrupt:
        print("\n\n⛔ Simulator stopped by user")
        print("=" * 60)

if __name__ == "__main__":
    main()
