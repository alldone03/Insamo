<?php

namespace Database\Seeders;

use App\Models\Device;
use App\Models\DeviceSetting;
use Illuminate\Database\Seeder;

class DeviceSettingSeeder extends Seeder
{
    public function run(): void
    {
        $devices = Device::all();

        foreach ($devices as $device) {
            DeviceSetting::create([
                'device_id' => $device->id,
                'initial_distance' => 10.0,
                'alert_threshold' => 50.0,
                'danger_threshold' => 80.0,
            ]);
        }
    }
}
