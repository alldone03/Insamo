<?php

namespace Database\Seeders;

use App\Models\Device;
use App\Models\SensorReading;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Number;

class SensorReadingSeeder extends Seeder
{
    public function run(): void
    {
        $devices = Device::all();

        foreach ($devices as $device) {
            // Create 10 readings for each device
            for ($i = 0; $i < 10; $i++) {
                SensorReading::create([
                    'device_id' => $device->id,
                    'recorded_at' => Carbon::now()->subHours($i),
                    'temperature' => rand(25, 35) + (rand(0, 99) / 100),
                    'humidity' => rand(60, 90) + (rand(0, 99) / 100),
                    'wind_speed' => rand(0, 20) + (rand(0, 99) / 100),
                    'water_level' => rand(0, 500) / 10,
                    'tilt_x' => rand(-10, 10) / 10,
                    'tilt_y' => rand(-10, 10) / 10,
                    'magnitude' => rand(0, 50) / 10,
                    'landslide_score' => rand(0, 100) / 100,
                    'landslide_status' => rand(0, 1) ? 'SAFE' : 'WARNING',
                ]);
            }
        }
    }
}
