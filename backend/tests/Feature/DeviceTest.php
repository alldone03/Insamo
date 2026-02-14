<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Device;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class DeviceTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_list_devices()
    {
        $user = User::factory()->create();
        $token = Auth::guard('api')->login($user);

        Device::create([
            'device_code' => 'D1',
            'name' => 'Device 1',
            'device_type' => 'SIGMA',
            'latitude' => 0,
            'longitude' => 0,
            'address' => 'Test Address'
        ]);

        $response = $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->getJson('/api/devices');

        $response->assertStatus(200)
            ->assertJsonCount(1);
    }

    public function test_authenticated_user_can_create_device()
    {
        $user = User::factory()->create();
        $token = Auth::guard('api')->login($user);

        $deviceData = [
            'device_code' => 'NEW-DEVICE',
            'name' => 'New Device',
            'device_type' => 'FLOWS',
            'latitude' => 10.5,
            'longitude' => 105.2,
            'address' => 'New Address'
        ];

        $response = $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->postJson('/api/devices', $deviceData);

        $response->assertStatus(201)
            ->assertJsonFragment(['device_code' => 'NEW-DEVICE']);

        $this->assertDatabaseHas('devices', ['device_code' => 'NEW-DEVICE']);
    }

    public function test_unauthenticated_user_cannot_create_device()
    {
        $response = $this->postJson('/api/devices', [
            'device_code' => 'FAIL',
        ]);

        $response->assertStatus(401);
    }
}
