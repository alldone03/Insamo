<?php

namespace App\Http\Controllers;

use App\Models\SensorReading;
use Illuminate\Http\Request;

class SensorReadingController extends Controller
{
    public function index(Request $request)
    {
        $query = SensorReading::query();
        if ($request->has('device_id')) {
            $query->where('device_id', $request->device_id);
        }
        return $query->latest('recorded_at')->paginate(50);
    }

    public function store(Request $request)
    {
        $request->validate([
            'device_code' => 'required|exists:devices,device_code',
            'recorded_at' => 'required|date',
        ]);

        // Lookup device by code
        $device = \App\Models\Device::where('device_code', $request->device_code)->first();
        
        if (!$device) {
            return response()->json(['error' => 'Device not found'], 404);
        }

        // Create sensor reading with device_id
        $data = $request->except('device_code');
        $data['device_id'] = $device->id;

        return SensorReading::create($data);
    }

    public function show(SensorReading $sensorReading)
    {
        return $sensorReading->load('classificationResults');
    }
}
