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
            'device_id' => 'required|exists:devices,id',
            'recorded_at' => 'required|date',
        ]);
        return SensorReading::create($request->all());
    }

    public function show(SensorReading $sensorReading)
    {
        return $sensorReading->load('classificationResults');
    }
}
