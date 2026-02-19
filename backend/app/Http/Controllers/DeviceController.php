<?php

namespace App\Http\Controllers;

use App\Models\Device;
use Illuminate\Http\Request;

class DeviceController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $query = Device::with(['settings', 'users', 'sensorReadings' => function ($q) {
            $q->latest('recorded_at')->limit(1);
        }]);

        // Only filter if NOT SuperAdmin (Role ID 1)
        if ($user->role_id !== 1) {
            $query->whereHas('users', function ($q) use ($user) {
                $q->where('users.id', $user->id);
            });
        }

        return $query->get();
    }

    public function publicIndex()
    {
        return Device::select('id', 'name', 'device_code', 'device_type', 'latitude', 'longitude', 'address')->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'device_code' => 'required|unique:devices',
            'name' => 'required',
            'device_type' => 'required|in:SIGMA,FLOWS,LANDSLIDE,WILDFIRE',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'address' => 'required',
            // Settings validation
            'initial_distance' => 'nullable|numeric',
            'alert_threshold' => 'nullable|numeric',
            'danger_threshold' => 'nullable|numeric',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $deviceData = $request->except('image');
        $device = Device::create($deviceData);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('devices', 'public');
            $device->update(['image' => $path]);
        } elseif ($request->filled('image') && is_string($request->image)) {
            // Case for URL-based images
            $device->update(['image' => $request->image]);
        }

        // Create device settings if provided
        if ($request->has('initial_distance') || $request->has('alert_threshold') || $request->has('danger_threshold')) {
            $device->settings()->create([
                'initial_distance' => $request->initial_distance ?? 10,
                'alert_threshold' => $request->alert_threshold ?? 50,
                'danger_threshold' => $request->danger_threshold ?? 80,
            ]);
        }

        return $device->load('settings');
    }

    public function show(Device $device)
    {
        // return null;
        // return $device->take(100);

        // return $device->load('settings', 'users', 'sensorReadings');

        $device->load([
            'settings',
            'users',
            'sensorReadings' => fn($q) =>
            $q->orderBy('created_at', 'desc')->limit(100)
        ]);

        // balik urutan setelah data diambil
        $device->sensorReadings = $device->sensorReadings
            ->reverse()
            ->values();

        return $device;
    }

    public function update(Request $request, Device $device)
    {
        $user = auth()->user();
        $isSuperAdmin = $user->role_id === 1;

        // Admin cannot update device_code and device_type
        $validationRules = [
            'name' => 'sometimes|required',
            'latitude' => 'sometimes|numeric',
            'longitude' => 'sometimes|numeric',
            'address' => 'sometimes|required',
            // Settings
            'initial_distance' => 'nullable|numeric',
            'alert_threshold' => 'nullable|numeric',
            'danger_threshold' => 'nullable|numeric',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ];

        // Only SuperAdmin can update device_code and device_type
        if ($isSuperAdmin) {
            $validationRules['device_code'] = 'sometimes|required|unique:devices,device_code,' . $device->id;
            $validationRules['device_type'] = 'sometimes|required|in:SIGMA,FLOWS,LANDSLIDE,WILDFIRE';
        }

        $request->validate($validationRules);

        // Update device basic info
        $deviceData = $request->only(['name', 'latitude', 'longitude', 'address']);
        if ($isSuperAdmin) {
            $deviceData = array_merge($deviceData, $request->only(['device_code', 'device_type']));
        }

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($device->image && \Storage::disk('public')->exists($device->image)) {
                \Storage::disk('public')->delete($device->image);
            }
            $path = $request->file('image')->store('devices', 'public');
            $deviceData['image'] = $path;
        } elseif ($request->filled('image') && is_string($request->image)) {
            // Case for manual URL update
            $deviceData['image'] = $request->image;
        }

        $device->update($deviceData);

        // Update or create settings
        if ($request->has('initial_distance') || $request->has('alert_threshold') || $request->has('danger_threshold')) {
            $settingsData = [
                'initial_distance' => $request->initial_distance ?? $device->settings->initial_distance ?? 10,
                'alert_threshold' => $request->alert_threshold ?? $device->settings->alert_threshold ?? 50,
                'danger_threshold' => $request->danger_threshold ?? $device->settings->danger_threshold ?? 80,
            ];

            if ($device->settings) {
                $device->settings->update($settingsData);
            } else {
                $device->settings()->create($settingsData);
            }
        }

        return $device->load('settings');
    }

    public function destroy(Device $device)
    {
        $device->delete();
        return response(null, 204);
    }
}
