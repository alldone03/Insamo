<?php

namespace App\Http\Controllers;

use App\Models\SensorReading;
use Illuminate\Http\Request;

class SensorReadingController extends Controller
{
    public function index(Request $request)
    {
        $query = SensorReading::query()->with('classificationResults');

        if ($request->has('device_id')) {
            $query->where('device_id', $request->device_id);
        }

        if ($request->has('start_date')) {
            $query->where('recorded_at', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->where('recorded_at', '<=', $request->end_date);
        }

        return $query->latest('recorded_at')->paginate($request->get('per_page', 50));
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

        $reading = SensorReading::create($data);

        // Alert Logic for Flood (FLOWS)
        if ($device->device_type === 'FLOWS' && isset($data['water_level'])) {
            $settings = $device->settings;
            if ($settings) {
                $level = (float)$data['water_level'];
                $status = 'NORMAL';
                $threshold = $settings->initial_distance;

                if ($level >= $settings->danger_threshold) {
                    $status = 'DANGER';
                    $threshold = $settings->danger_threshold;
                } elseif ($level >= $settings->alert_threshold) {
                    $status = 'ALERT';
                    $threshold = $settings->alert_threshold;
                }

                if ($status !== 'NORMAL') {
                    \App\Services\TelegramService::sendFloodAlert($device, $status, $level, $threshold);
                }
            }
        }

        return $reading;
    }

    public function show(SensorReading $sensorReading)
    {
        return $sensorReading->load('classificationResults');
    }
}
