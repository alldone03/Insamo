<?php

namespace Database\Seeders;

use App\Models\Device;
use Illuminate\Database\Seeder;

class DeviceSeeder extends Seeder
{
    public function run(): void
    {
        // SIGMA / Earthquake
        Device::updateOrCreate(
            ['device_code' => 'SIGMA-001'],
            [
                'name' => 'Seismic Node A1',
                'device_type' => 'SIGMA',
                'latitude' => -6.200000,
                'longitude' => 106.816666,
                'address' => 'Jakarta, Indonesia'
            ]
        );

        // FLOWS / Flood
        Device::updateOrCreate(
            ['device_code' => 'FLOWS-001'],
            [
                'name' => 'Ciliwung River Sensor',
                'device_type' => 'FLOWS',
                'latitude' => -6.220100,
                'longitude' => 106.827000,
                'address' => 'Jakarta South'
            ]
        );

        Device::updateOrCreate(
            ['device_code' => 'FLOWS-002'],
            [
                'name' => 'Bandung Basin Monitor',
                'device_type' => 'FLOWS',
                'latitude' => -6.917464,
                'longitude' => 107.619125,
                'address' => 'Bandung, Indonesia'
            ]
        );

        // LANDSLIDE
        Device::updateOrCreate(
            ['device_code' => 'LANDSLIDE-001'],
            [
                'name' => 'Puncak Pass Monitor',
                'device_type' => 'LANDSLIDE',
                'latitude' => -6.702400,
                'longitude' => 106.993000,
                'address' => 'Bogor Regancy'
            ]
        );

        // WILDFIRE
        Device::updateOrCreate(
            ['device_code' => 'WILDFIRE-001'],
            [
                'name' => 'Kalimantan Forest Node',
                'device_type' => 'WILDFIRE',
                'latitude' => -1.269160,
                'longitude' => 116.825264,
                'address' => 'Balikpapan Surrounding'
            ]
        );
    }
}
