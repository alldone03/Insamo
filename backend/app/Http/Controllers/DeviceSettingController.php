<?php

namespace App\Http\Controllers;

use App\Models\DeviceSetting;
use Illuminate\Http\Request;

class DeviceSettingController extends Controller
{
    public function index(Request $request)
    {
         $query = DeviceSetting::query();
        if ($request->has('device_id')) {
            $query->where('device_id', $request->device_id);
        }
        return $query->with('device')->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'device_id' => 'required|exists:devices,id',
            'initial_distance' => 'required|numeric',
            'alert_threshold' => 'required|numeric',
            'danger_threshold' => 'required|numeric'
        ]);
        return DeviceSetting::create($request->all());
    }

    public function show(DeviceSetting $deviceSetting)
    {
        return $deviceSetting->load('device');
    }

    public function update(Request $request, DeviceSetting $deviceSetting)
    {
        $request->validate([
             'device_id' => 'sometimes|exists:devices,id',
             'initial_distance' => 'sometimes|numeric',
             'alert_threshold' => 'sometimes|numeric',
             'danger_threshold' => 'sometimes|numeric',
        ]);
        $deviceSetting->update($request->all());
        return $deviceSetting;
    }

    public function destroy(DeviceSetting $deviceSetting)
    {
        $deviceSetting->delete();
        return response(null, 204);
    }
}
