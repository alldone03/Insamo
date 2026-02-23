<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class WeatherReadingController extends Controller
{
    public function index()
    {
        return \App\Models\WeatherReading::latest('recorded_at')->paginate(50);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'temperature' => 'required|numeric',
            'humidity' => 'required|numeric',
            'pressure' => 'required|numeric',
            'wind_speed' => 'required|numeric',
            'recorded_at' => 'required|date',
        ]);

        return \App\Models\WeatherReading::create($data);
    }

    public function latest()
    {
        return \App\Models\WeatherReading::latest('recorded_at')->first();
    }
}
