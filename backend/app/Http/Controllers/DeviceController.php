<?php

namespace App\Http\Controllers;

use App\Models\Device;
use Illuminate\Http\Request;

class DeviceController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $query = Device::with(['settings', 'users']);

        // Only filter if NOT SuperAdmin (Role ID 1)
        if ($user->role_id !== 1) {
            $query->whereHas('users', function($q) use ($user) {
                $q->where('users.id', $user->id);
            });
        }

        return $query->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'device_code' => 'required|unique:devices',
            'name' => 'required',
            'device_type' => 'required|in:SIGMA,FLOWS,LANDSLIDE',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'address' => 'required'
        ]);
        return Device::create($request->all());
    }

    public function show(Device $device)
    {
        return $device->load('settings', 'users', 'sensorReadings');
    }

    public function update(Request $request, Device $device)
    {
         $request->validate([
            'device_code' => 'sometimes|required|unique:devices,device_code,'.$device->id,
            'name' => 'sometimes|required',
             'device_type' => 'sometimes|required|in:SIGMA,FLOWS,LANDSLIDE'
        ]);
        $device->update($request->all());
        return $device;
    }

    public function destroy(Device $device)
    {
        $device->delete();
        return response(null, 204);
    }
}
