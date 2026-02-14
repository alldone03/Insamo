<?php

namespace Database\Seeders;

use App\Models\Device;
use Illuminate\Database\Seeder;

class DeviceSeeder extends Seeder
{
    public function run(): void
    {
        Device::create([
            'device_code' => 'SIGMA-001',
            'name' => 'Sigma Sensor 1',
            'device_type' => 'SIGMA',
            'latitude' => -6.200000,
            'longitude' => 106.816666,
            'address' => 'Jakarta, Indonesia'
        ]);

        Device::create([
            'device_code' => 'FLOWS-001',
            'name' => 'Flow Sensor A',
            'device_type' => 'FLOWS',
            'latitude' => -6.917464,
            'longitude' => 107.619125,
            'address' => 'Bandung, Indonesia'
        ]);

        Device::create([
            'device_code' => 'LANDSLIDE-001',
            'name' => 'Landslide Detector X',
            'device_type' => 'LANDSLIDE',
            'latitude' => -7.795580,
            'longitude' => 110.369490,
            'address' => 'Yogyakarta, Indonesia'
        ]);
    }
}
